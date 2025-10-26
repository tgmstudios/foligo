//
//  OnboardingView.swift
//  foligo
//
//  Created by Ryan Nair on 10/25/25.
//

import SwiftUI

private enum FoligoAPI {
    static let baseURL = URL(string: "https://api.foligo.tech")!

    static func createProject(name: String, description: String?, authToken: String) async throws -> ProjectResponse {
        var request = URLRequest(url: baseURL.appendingPathComponent("/api/projects"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        let body = ["name": name, "description": description ?? ""]
        request.httpBody = try JSONEncoder().encode(body)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(ProjectResponse.self, from: data)
    }

    static func markOnboardingComplete(authToken: String) async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent("/api/users/me"))
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        let body = ["hasCompletedOnboarding": true]
        request.httpBody = try JSONEncoder().encode(body)
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
    
    static func updatePreferences(projectId: String, preferences: ColorPreferences, authToken: String) async throws {
        let url = baseURL.appendingPathComponent("/api/projects/\(projectId)/site-config")
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

        let body: [String: String] = [
            "primaryColor": preferences.primaryHex,
            "secondaryColor": preferences.secondaryHex,
            "accentColor": preferences.accentHex,
            "backgroundColor": preferences.backgroundHex,
            "textColor": preferences.textHex
        ]
        
        request.httpBody = try JSONEncoder().encode(body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
}

struct ProjectResponse: Decodable {
    let id: String
    let name: String
    let description: String?
}

struct ProjectDetails {
    var name: String = ""
    var description: String = ""
}

struct Template: Identifiable, Hashable {
    let id: String
    var name: String
    var description: String
    var iconName: String

    static func == (lhs: Template, rhs: Template) -> Bool {
        lhs.id == rhs.id
    }
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

fileprivate extension Template {
    static let all: [Template] = [
        Template(id: "blank", name: "Blank Project", description: "Start from scratch", iconName: "doc.plaintext"),
        Template(id: "portfolio", name: "Portfolio Template", description: "Perfect for showcasing your work", iconName: "briefcase"),
        Template(id: "blog", name: "Blog Template", description: "Great for writing and sharing", iconName: "pencil.and.ruler"),
        Template(id: "showcase", name: "Project Showcase", description: "Highlight your projects", iconName: "folder"),
        Template(id: "resume", name: "Resume Template", description: "Professional resume and CV", iconName: "person.text.rectangle"),
        Template(id: "creative", name: "Creative Portfolio", description: "For artists and professionals", iconName: "paintpalette")
    ]
}

// MARK: - OnboardingView (uses the new ScrollAwareView)
struct OnboardingView: View {
    @State private var currentStep = 0
    @State private var projectDetails = ProjectDetails()
    @State var colorPreferences = ColorPreferences()
    @State private var selectedTemplate: Template? = nil
    @State private var isLoading = false
    @Binding var userToken: String?

    private let totalSteps = 3

    var body: some View {
        VStack() {
            TabView(selection: $currentStep) {
                WelcomeScreen()
                    .tag(0)
                CreateProjectScreen(details: $projectDetails)
                    .tag(1)
                TemplateScreen(selectedTemplate: $selectedTemplate)
                    .tag(2)
                
                WebsitePaletteBuilderView(palette: $colorPreferences)
                    .tag(3)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut, value: currentStep)
            
            if isLoading {
                ProgressView("Setting up your workspace…")
                    .padding()
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
                    .padding(.bottom, 40)
                    .zIndex(3)
            }
            else {
                NavigationControls(
                    currentStep: $currentStep,
                    isValid: formIsValid,
                    onComplete: completeOnboarding
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 20)
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .zIndex(2)
            }
        }
        .background(Color.appBackground.ignoresSafeArea())
    }

    private var formIsValid: Bool {
        if currentStep == 1 { return !projectDetails.name.trimmingCharacters(in: .whitespaces).isEmpty }
        if currentStep == 2 { return selectedTemplate != nil }
        
        if currentStep == totalSteps {
            return selectedTemplate != nil && !projectDetails.name.trimmingCharacters(in: .whitespaces).isEmpty
        }
        return true
    }

    private func completeOnboarding() {
        Task {
            isLoading = true
            defer { isLoading = false }
            do {
                let authToken = userToken.unsafelyUnwrapped
                let project = try await FoligoAPI.createProject(name: projectDetails.name, description: projectDetails.description, authToken: authToken)
                
                try await FoligoAPI.updatePreferences(projectId: project.id, preferences: colorPreferences, authToken: authToken)
                try await FoligoAPI.markOnboardingComplete(authToken: authToken)
                print("✅ Onboarding complete for project \(project.name)")
            } catch {
                print("❌ API Error: \(error.localizedDescription)")
            }
        }
    }
}

struct NavigationControls: View {
    @Binding var currentStep: Int
    let isValid: Bool
    var onComplete: () -> Void
    private let totalSteps = 3

    var body: some View {
        HStack {
            if currentStep > 0 {
                Button("Previous") {
                    withAnimation(.spring()) { currentStep = max(0, currentStep - 1) }
                }
                .buttonStyle(SecondaryButtonStyle())
            }

            Spacer()

            Button(action: {
                if currentStep < totalSteps {
                    withAnimation(.easeInOut) {
                        currentStep += 1
                    }
                } else {
                    onComplete()
                }
            }) {
                Text(currentStep < totalSteps ? "Next" : "Complete Setup")
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(!isValid)
            .opacity(isValid ? 1 : 0.6)
        }
        .padding(.vertical, 8)
        .padding(.horizontal)
    }
}

struct TemplateScreen: View {
    @Binding var selectedTemplate: Template?

    private let templates = Template.all

    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]

    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 12) {
                Text("Choose a Template")
                    .font(.largeTitle.bold())
                    .foregroundColor(.appTextPrimary)

                Text("Select a template to get started quickly, or choose blank to start from scratch.")
                    .font(.headline)
                    .foregroundColor(.appTextSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 24)
            .padding(.top, 60)

            ScrollView {
                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(templates) { template in
                        TemplateCardView(template: template, isSelected: selectedTemplate == template)
                            .onTapGesture {
                                withAnimation(.spring(response: 0.36, dampingFraction: 0.72)) {
                                    selectedTemplate = template
                                }
                            }
                    }
                }
                .padding(24)
            }
        }
    }
}

struct TemplateCardView: View {
    let template: Template
    let isSelected: Bool

    var body: some View {
        ZStack(alignment: .topTrailing) {
            VStack(alignment: .leading, spacing: 12) {
                Image(systemName: template.iconName)
                    .font(.title)
                    .foregroundColor(isSelected ? .appPrimary : .appTextSecondary)
                    .padding(16)
                    .background(isSelected ? Color.appPrimary.opacity(0.12) : Color.gray.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                Text(template.name)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.appTextPrimary)

                Text(template.description)
                    .font(.caption)
                    .foregroundColor(.appTextSecondary)
                    .lineLimit(2, reservesSpace: true)
            }
            .padding(16)
            .frame(minHeight: 180)
            .frame(maxWidth: .infinity)
            .background(Color.white)
            .clipShape(.rect(corners: .fixed(16)))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(isSelected ? Color.appPrimary : Color.clear, lineWidth: isSelected ? 2 : 0)
            )
            .shadow(color: isSelected ? Color.appPrimary.opacity(0.08) : .black.opacity(0.04), radius: 6, y: 3)
            .scaleEffect(isSelected ? 1.03 : 1.0)
            .animation(.spring(response: 0.32, dampingFraction: 0.72), value: isSelected)

            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title2)
                    .foregroundColor(.white)
                    .background(Circle().fill(Color.appPrimary).frame(width: 36, height: 36))
                    .offset(x: -12, y: 12)
                    .transition(.scale.combined(with: .opacity))
            }
        }
    }
}

// MARK: - CreateProjectScreen (unchanged)
struct CreateProjectScreen: View {
    @Binding var details: ProjectDetails
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Spacer()
            
            VStack(alignment: .center, spacing: 12) {
                Text("Create Your First Project")
                    .font(.largeTitle.bold())
                    .foregroundColor(.appTextPrimary)
                
                Text("Let's start by creating your first portfolio project. You can always add more later.")
                    .font(.headline)
                    .foregroundColor(.appTextSecondary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.bottom, 24)
            
            // Project Name (required)
            VStack(alignment: .leading, spacing: 8) {
                Text("Project Name")
                    .font(.headline)
                    .foregroundColor(.appTextPrimary)
                
                TextField("e.g., App Development", text: $details.name)
                    .padding()
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(details.name.trimmingCharacters(in: .whitespaces).isEmpty ? Color.red.opacity(0.8) : Color.gray.opacity(0.2), lineWidth: 1)
                    )
                    .foregroundStyle(.black)
                
                if details.name.trimmingCharacters(in: .whitespaces).isEmpty {
                    Text("Project name is required.")
                        .font(.caption)
                        .foregroundColor(.red)
                        .transition(.opacity)
                }
            }
            
            Text("Description (Optional)")
                .font(.headline)
                .foregroundColor(.appTextPrimary)
            
            TextEditor(text: $details.description)
                .frame(height: 120)
                .padding(12)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                )
                .scrollContentBackground(.hidden)
                .foregroundStyle(.black)
            Spacer()
        }
        .padding(24)
    }
}

// MARK: - Reusables and Styles (kept)
struct RadioSelectionRow: View {
    let title: String
    let isSelected: Bool

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                .font(.title2)
                .foregroundColor(isSelected ? .appPrimary : .gray.opacity(0.4))
                .scaleEffect(isSelected ? 1.0 : 0.9)

            Text(title)
                .font(.headline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(.appTextPrimary)

            Spacer()
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isSelected ? Color.appPrimary.opacity(0.5) : Color.gray.opacity(0.2), lineWidth: 1)
        )
        .shadow(color: isSelected ? Color.appPrimary.opacity(0.08) : .clear, radius: 8, y: 4)
    }
}

struct CheckboxToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button(action: { configuration.isOn.toggle() }) {
            HStack(spacing: 12) {
                Image(systemName: configuration.isOn ? "checkmark.square.fill" : "square")
                    .font(.title2)
                    .foregroundColor(configuration.isOn ? .appPrimary : .gray.opacity(0.4))
                configuration.label
            }
        }
        .buttonStyle(.plain)
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline.bold())
            .foregroundColor(.white)
            .padding(.vertical, 14)
            .padding(.horizontal, 26)
            .background(Color.appPrimary)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.spring(response: 0.28, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline.bold())
            .foregroundColor(.appTextSecondary)
            .padding(.vertical, 14)
            .padding(.horizontal, 26)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.spring(response: 0.28, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

// MARK: - Welcome + small helpers (kept)
struct WelcomeScreen: View {
    @State private var hasAppeared = false

    let features = [
        Feature(iconName: "plus.rectangle.on.rectangle.fill", title: "Create Projects", description: "Organize your work into projects"),
        Feature(iconName: "pencil.and.outline", title: "Manage Content", description: "Add and organize your content"),
        Feature(iconName: "sparkles", title: "AI Features", description: "Get AI powered insights")
    ]

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "book.closed.fill")
                .font(.system(size: 40))
                .foregroundColor(.appPrimary)
                .padding(24)
                .background(Color.white)
                .clipShape(Circle())
                .shadow(color: .black.opacity(0.05), radius: 10, y: 5)
                .scaleEffect(hasAppeared ? 1 : 0.8)
                .opacity(hasAppeared ? 1 : 0)

            VStack(spacing: 12) {
                Text("Welcome to Foligo!")
                    .font(.largeTitle.bold())
                    .foregroundColor(.appTextPrimary)

                Text("Let's get you set up with your portfolio management dashboard")
                    .font(.headline)
                    .foregroundColor(.appTextSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            .opacity(hasAppeared ? 1 : 0)
            .animation(.easeOut(duration: 0.5).delay(0.2), value: hasAppeared)

            HStack(spacing: 16) {
                ForEach(Array(features.enumerated()), id: \.element.id) { index, feature in
                    FeatureHighlightView(feature: feature)
                        .opacity(hasAppeared ? 1 : 0)
                        .animation(.easeOut(duration: 0.5).delay(0.4 + Double(index) * 0.15), value: hasAppeared)
                }
            }
            .padding()

            Spacer()
            Spacer()
        }
        .padding(24)
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) { hasAppeared = true }
        }
    }
}

struct Feature: Identifiable, Hashable {
    let id = UUID()
    var iconName: String
    var title: String
    var description: String
}

struct FeatureHighlightView: View {
    let feature: Feature

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: feature.iconName)
                .font(.title2)
                .foregroundColor(.indigo)
                .padding(16)
                .background(Color.indigo.opacity(0.1))
                .clipShape(.rect(corners: .fixed(12)))

            Text(feature.title)
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundStyle(.black)

            Text(feature.description)
                .font(.caption)
                .foregroundStyle(.gray)
                .multilineTextAlignment(.leading)
        }
        .padding(12)
        .background(Color.white)
        .clipShape(.rect(corners: .fixed(16)))
        .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
    }
}

// MARK: - Color palette
extension Color {
    static let appPrimary = Color(hex: "4F46E5")
    static let appBackground = Color(hex: "F9FAFB")
    static let appTextPrimary = Color(hex: "111827")
    static let appTextSecondary = Color(hex: "6B7280")
}

#Preview {
    OnboardingView(userToken: .constant(""))
}
