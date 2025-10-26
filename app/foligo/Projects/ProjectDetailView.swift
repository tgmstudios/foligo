//
//  ProjectDetailView.swift
//  foligo
//
//  Created by Ryan Nair on 10/25/25.
//

import SwiftUI
import Markdown
import Markdownosaur
import Combine

// ---------- Models ----------
enum CMSContentType: String, Codable, CaseIterable {
    case blog = "BLOG"
    case portfolio = "PORTFOLIO"
    case experience = "EXPERIENCE"
}

struct CMSContent: Codable, Identifiable, Equatable {
    var id: UUID
    var contentType: CMSContentType
    var title: String
    var slug: String
    var excerpt: String
    var content: String
    var isPublished: Bool
    var order: Int?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, title, slug, excerpt, content
        case contentType = "contentType"
        case isPublished, order, updatedAt
    }
}

// ---------- API Layer ----------
private extension FoligoAPI {
    static func getProjectContent(projectId: String, authToken: String) async throws -> [CMSContent] {
        var request = URLRequest(url: baseURL.appendingPathComponent("/api/projects/\(projectId)/content"))
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

        let (data, resp) = try await URLSession.shared.data(for: request)
        try validate(resp)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode([CMSContent].self, from: data)
    }

    static func createContent(projectId: String, authToken: String, payload: CreateContentPayload) async throws -> CMSContent {
        var request = URLRequest(url: baseURL.appendingPathComponent("/api/projects/\(projectId)/content"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        request.httpBody = try encoder.encode(payload)

        let (data, resp) = try await URLSession.shared.data(for: request)
        
        try validate(resp)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(CMSContent.self, from: data)
    }

    static func updateContentFields(contentId: UUID, authToken: String, payload: UpdateContentFieldsPayload) async throws -> CMSContent {
        var request = URLRequest(url: baseURL.appendingPathComponent("/api/content/\(contentId.uuidString.lowercased())/fields"))
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        request.httpBody = try encoder.encode(payload)

        let (data, resp) = try await URLSession.shared.data(for: request)
        print(String(decoding: data, as: UTF8.self))
        try validate(resp)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(CMSContent.self, from: data)
    }

    static func reorderContent(contentId: UUID, authToken: String, newOrder: Int) async throws -> CMSContent {
        var request = URLRequest(url: baseURL.appendingPathComponent("/api/content/\(contentId.uuidString.lowercased())/reorder"))
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        let body = ["newOrder": newOrder]
        request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])

        let (data, resp) = try await URLSession.shared.data(for: request)
        print(String(decoding: data, as: UTF8.self))
        try validate(resp)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(CMSContent.self, from: data)
    }

    static func deleteContent(contentId: UUID, authToken: String) async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent("/api/content/\(contentId.uuidString.lowercased())"))
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        let (_, resp) = try await URLSession.shared.data(for: request)
        try validate(resp)
    }

    // Helper
    static func validate(_ urlResponse: URLResponse) throws {
        guard let http = urlResponse as? HTTPURLResponse else { return }
        guard (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
}

// ---------- API Payloads ----------
struct CreateContentPayload: Codable {
    var contentType: String
    var title: String
    var slug: String?
    var excerpt: String?
    var content: String
    var metadata: [String: String]?
    var isPublished: Bool
}

struct UpdateContentFieldsPayload: Codable {
    var title: String?
    var slug: String?
    var excerpt: String?
    var content: String?
    var metadata: [String: String]?
    var isPublished: Bool?
}

// ---------- ViewModel ----------
@MainActor
final class ProjectContentViewModel: ObservableObject {
    @Published private(set) var content: [CMSContent] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    private let projectId: String
    private let token: String

    init(projectId: String, token: String) {
        self.projectId = projectId
        self.token = token
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let items = try await FoligoAPI.getProjectContent(projectId: projectId, authToken: token)
            // sort by order if available
            self.content = items.sorted { (a, b) in
                (a.order ?? 0) < (b.order ?? 0)
            }
        } catch {
            self.errorMessage = "Failed to load content: \(error.localizedDescription)"
        }
    }

    func create(payload: CreateContentPayload) async -> Bool {
        do {
            let created = try await FoligoAPI.createContent(projectId: projectId, authToken: token, payload: payload)
            withAnimation(.interactiveSpring()) {
                content.append(created)
                content.sort { (a, b) in (a.order ?? 0) < (b.order ?? 0) }
            }
            return true
        } catch {
            self.errorMessage = "Create failed: \(error.localizedDescription)"
            return false
        }
    }

    func updateContentFields(_ id: UUID, payload: UpdateContentFieldsPayload) async -> Bool {
        guard let idx = content.firstIndex(where: { $0.id == id }) else { return false }
        let old = content[idx]
        do {
            let updated = try await FoligoAPI.updateContentFields(contentId: id, authToken: token, payload: payload)
            withAnimation(.easeInOut) {
                content[idx] = updated
            }
            return true
        } catch {
            // revert
            content[idx] = old
            self.errorMessage = "Update failed: \(error.localizedDescription)"
            return false
        }
    }

    func delete(_ id: UUID) async -> Bool {
        guard let idx = content.firstIndex(where: { $0.id == id }) else { return false }
        let removed = content.remove(at: idx)
        do {
            try await FoligoAPI.deleteContent(contentId: removed.id, authToken: token)
            return true
        } catch {
            // revert
            content.insert(removed, at: idx)
            self.errorMessage = "Delete failed: \(error.localizedDescription)"
            return false
        }
    }

    // MARK: - Reorder
    func move(from source: IndexSet, to destination: Int) {
        withAnimation(.interactiveSpring()) {
            content.move(fromOffsets: source, toOffset: destination)
        }
        // After local move, update server for all impacted items (simple approach: update each item with its new index)
        Task { await pushOrderChanges() }
    }

    private func pushOrderChanges() async {
        // optimistic: push each item one-by-one (server expects one item's reorder; backend defined /content/{id}/reorder)
        for (index, item) in content.enumerated() {
            do {
                _ = try await FoligoAPI.reorderContent(contentId: item.id, authToken: token, newOrder: index)
                // optionally update local item order from server response
            } catch {
                // handle failure gracefully: set error and consider reloading full list
                await MainActor.run {
                    self.errorMessage = "Failed to save order: \(error.localizedDescription)"
                }
            }
        }
        // Optionally re-fetch server ordering to reconcile
    }
}

// ---------- Views ----------

struct ProjectDetailView: View {
    let projectName: String
    let projectId: String
    let userToken: String

    @StateObject private var vm: ProjectContentViewModel
    @State private var showingAddSheet = false
    @State private var editContent: CMSContent?
    @State private var showAlert = false

    init(projectName: String, projectId: String, userToken: String) {
        self.projectName = projectName
        self.projectId = projectId
        self.userToken = userToken
        _vm = StateObject(wrappedValue: ProjectContentViewModel(projectId: projectId, token: userToken))
    }

    var body: some View {
        NavigationStack {
            Group {
                if vm.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if vm.content.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "doc.text.magnifyingglass")
                            .font(.system(size: 48))
                            .symbolRenderingMode(.multicolor)
                        Text("No Content Found")
                            .font(.title2.weight(.semibold))
                        Text("Create your first post or project.")
                            .foregroundStyle(.secondary)
                        Button(action: { showingAddSheet = true }) {
                            Label("Add Content", systemImage: "plus")
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    contentList
                }
            }
            .navigationTitle(projectName)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showingAddSheet = true }) {
                        Label("Add", systemImage: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddSheet) {
                ContentEditorSheet(mode: .create, projectId: projectId, token: userToken) { newPayload in
                    Task { await vm.create(payload: newPayload) }
                }
            }
            .sheet(item: $editContent) { content in
                // Note: same onCreate closure, not UpdateContentFieldsPayload
                ContentEditorSheet(mode: .edit(existing: content), projectId: projectId, token: userToken) { _ in }
            }
            .onAppear {
                Task { await vm.load() }
            }
            .alert("Error", isPresented: Binding(get: { vm.errorMessage != nil }, set: { if !$0 { vm.errorMessage = nil } })) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(vm.errorMessage ?? "Unknown error")
            }
        }
    }

    private var contentList: some View {
        List {
            ForEach(vm.content) { item in
                ContentRowView(item: item)
                    .swipeActions(edge: .trailing) {
                        Button(role: .destructive) {
                            Task {
                                let _ = await vm.delete(item.id)
                            }
                        } label: { Label("Delete", systemImage: "trash") }

                        Button {
                            editContent = item
                        } label: { Label("Edit", systemImage: "pencil") }
                        .tint(.blue)

                        Button {
                            // toggle publish
                            Task {
                                var payload = UpdateContentFieldsPayload()
                                payload.isPublished = !item.isPublished
                                let _ = await vm.updateContentFields(item.id, payload: payload)
                            }
                        } label: { Label(item.isPublished ? "Unpublish" : "Publish", systemImage: item.isPublished ? "eye.slash" : "checkmark.circle") }
                    }
            }
            .onMove(perform: vm.move)
        }
        .listStyle(.insetGrouped)
        .animation(.interactiveSpring(), value: vm.content)
        .toolbar {
            EditButton()
        }
    }
}

struct ContentRowView: View {
    let item: CMSContent

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            typeBadge
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(item.title)
                        .font(.headline)
                    Spacer()
                    Text(item.isPublished ? "Published" : "Draft")
                        .font(.caption)
                        .foregroundStyle(item.isPublished ? .green : .secondary)
                        .padding(6)
                        .background(.thinMaterial)
                        .clipShape(Capsule())
                }
                Text(item.excerpt)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                // small markdown snippet (first paragraph)
                if let snippet = markdownSnippet(item.content) {
                    Text(snippet)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }
        }
        .padding(.vertical, 8)
    }

    private var typeBadge: some View {
        Text(item.contentType.rawValue.capitalized)
            .font(.caption.bold())
            .padding(.vertical, 6)
            .padding(.horizontal, 10)
            .background(badgeColor)
            .foregroundStyle(.white)
            .clipShape(Capsule())
    }

    private var badgeColor: Color {
        switch item.contentType {
        case .blog: return .red
        case .portfolio: return .teal
        case .experience: return .indigo
        }
    }

    private func markdownSnippet(_ markdown: String) -> String? {
        // naive extract first paragraph
        let parts = markdown.split(separator: "\n\n", maxSplits: 1, omittingEmptySubsequences: true)
        return parts.first.map { String($0) }
    }
}

// ---------- Editor Sheet ----------
enum EditorMode: Equatable {
    case create
    case edit(existing: CMSContent)

    static func == (lhs: EditorMode, rhs: EditorMode) -> Bool {
        switch (lhs, rhs) {
        case (.create, .create): return true
        case let (.edit(a), .edit(b)): return a.id == b.id
        default: return false
        }
    }
}

struct ContentEditorSheet: View {
    let mode: EditorMode
    let projectId: String
    let token: String
    /// Called only for "create" mode; edit saves internally.
    var onCreate: (CreateContentPayload) async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var contentType: CMSContentType = .blog
    @State private var title = ""
    @State private var slug = ""
    @State private var excerpt = ""
    @State private var markdown = "# Title\n\nStart writing your content..."
    @State private var metadata: [String: String] = [:]
    @State private var isPublished = false
    @State private var isSaving = false
    @State private var showPreview = true

    init(mode: EditorMode,
         projectId: String,
         token: String,
         onCreate: @escaping (CreateContentPayload) async -> Void) {
        self.mode = mode
        self.projectId = projectId
        self.token = token
        self.onCreate = onCreate
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("Type", selection: $contentType) {
                        ForEach(CMSContentType.allCases, id: \.self) { c in
                            Text(c.rawValue.capitalized).tag(c)
                        }
                    }
                    TextField("Title", text: $title)
                    TextField("Slug (optional)", text: $slug)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                    TextField("Excerpt", text: $excerpt)
                }

                Section(header: Text("Markdown")) {
                    if showPreview {
                        VStack(alignment: .leading, spacing: 8) {
                            TextEditor(text: $markdown)
                                .frame(minHeight: 150)
                            Divider()
                            markdownPreview(markdown)
                                .frame(minHeight: 120)
                        }
                    } else {
                        TextEditor(text: $markdown)
                            .frame(minHeight: 250)
                    }
                    Button(showPreview ? "Hide Preview" : "Show Preview") {
                        showPreview.toggle()
                    }
                }

                Section("Meta") {
                    TextField("Tags", text: Binding(get: {
                        metadata["tags"] ?? ""
                    }, set: { metadata["tags"] = $0 }))
                    TextField("Project URL", text: Binding(get: {
                        metadata["projectUrl"] ?? ""
                    }, set: { metadata["projectUrl"] = $0 }))
                }

                Toggle("Publish", isOn: $isPublished)
            }
            .navigationTitle(modeNavTitle)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await save() }
                    } label: {
                        if isSaving {
                            ProgressView()
                        } else {
                            Text("Save")
                        }
                    }
                    .disabled(isSaving || title.isEmpty)
                }
            }
            .onAppear(perform: populateForEditIfNeeded)
        }
    }

    private var modeNavTitle: String {
        switch mode {
        case .create: return "New Content"
        case .edit: return "Edit Content"
        }
    }

    private func populateForEditIfNeeded() {
        if case let .edit(existing) = mode {
            contentType = existing.contentType
            title = existing.title
            slug = existing.slug
            excerpt = existing.excerpt
            markdown = existing.content
            isPublished = existing.isPublished
        }
    }

    private func save() async {
        isSaving = true
        defer { isSaving = false }

        let createPayload = CreateContentPayload(
            contentType: contentType.rawValue,
            title: title,
            slug: slug.isEmpty ? nil : slug.lowercased(),
            excerpt: excerpt,
            content: markdown,
            metadata: metadata,
            isPublished: isPublished
        )

        switch mode {
        case .create:
            await onCreate(createPayload)
            dismiss()

        case let .edit(existing):
            let updatePayload = UpdateContentFieldsPayload(
                title: title,
                slug: slug.isEmpty ? nil : slug,
                excerpt: excerpt,
                content: markdown,
                metadata: metadata,
                isPublished: isPublished
            )
            do {
                _ = try await FoligoAPI.updateContentFields(
                    contentId: existing.id,
                    authToken: token,
                    payload: updatePayload
                )
                dismiss()
            } catch {
                print("Update failed: \(error)")
            }
        }
    }

    @ViewBuilder
    private func markdownPreview(_ markdown: String) -> some View {
        if let attributed = try? makeAttributedStringFromMarkdown(markdown) {
            Text(AttributedString(attributed))
        } else {
            Text(markdown)
                .foregroundStyle(.secondary)
        }
    }

    private func makeAttributedStringFromMarkdown(_ md: String) throws -> NSAttributedString {
        // If Markdownosaur is available, use it. Otherwise use Apple's Markdown.Document -> AttributedString
        // Example using Markdownosaur (uncomment if available):
         let doc = Document(parsing: md)
         var mdosaur = Markdownosaur()
         let attributed = mdosaur.attributedString(from: doc)
         return attributed

        // Fallback using Apple's Markdown parsing library:
//        let doc = try Markdown.Document(parsing: md)
//        let mdosaurish = AttributedString(doc) // convert Document to AttributedString
//        return NSAttributedString(mdosaurish)
    }
}

// ---------- Preview ----------
struct ProjectDetailView_Previews: PreviewProvider {
    static var previews: some View {
        let dummyToken = "TOKEN"
        ProjectDetailView(projectName: "Example Project", projectId: "project-123", userToken: dummyToken)
    }
}
