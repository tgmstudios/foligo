//
//  ProjectsDashboard.swift
//  foligo
//
//  Created by Ryan Nair on 10/25/25.
//

import SwiftUI

enum ProjectSortOption: String, CaseIterable, Identifiable {
    case name = "Name"
    case created = "Created"
    case updated = "Last Updated"

    var id: String { rawValue }
}

struct ProjectsDashboard: View {
    var projects: Projects
    @Binding var userToken: String?
    @Namespace private var animation

    @State private var selectedProject: Project?
    @State private var searchText = ""
    @State private var selectedCategory: ProjectCategory = .owned
    @State private var sortOrder: SortOrder = .newest

    enum ProjectCategory: String, CaseIterable, Identifiable {
        case owned = "Owned"
        case member = "Member"
        var id: Self { self }
    }

    enum SortOrder: String, CaseIterable, Identifiable {
        case newest = "Newest"
        case oldest = "Oldest"
        case alphabetical = "A–Z"
        var id: Self { self }
    }

    // MARK: - Filtered + Sorted Projects
    private var filteredProjects: [Project] {
        let source = selectedCategory == .owned ? projects.ownedProjects : projects.memberProjects

        let filtered = source.filter {
            searchText.isEmpty ||
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            $0.description.localizedCaseInsensitiveContains(searchText)
        }

        switch sortOrder {
        case .newest:
            return filtered.sorted { $0.updatedAt > $1.updatedAt }
        case .oldest:
            return filtered.sorted { $0.updatedAt < $1.updatedAt }
        case .alphabetical:
            return filtered.sorted { $0.name < $1.name }
        }
    }

    // MARK: - Body
    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(filteredProjects, id: \.id) { project in
                        ProjectListCard(project: project)
                            .onTapGesture {
                                withAnimation(.spring(duration: 0.5)) {
                                    selectedProject = project
                                }
                            }
                            .scrollTransition { content, phase in
                                content
                                    .opacity(phase.isIdentity ? 1 : 0)
                                    .scaleEffect(phase.isIdentity ? 1 : 0.75)
                                    .blur(radius: phase.isIdentity ? 0 : 10)
                            }
                    }
                }
                .padding(.vertical, 20)
                .padding(.horizontal, 16)
            }
            .scrollIndicators(.hidden)
            .background(.ultraThinMaterial)
            .animation(.smooth(duration: 0.3), value: filteredProjects)
            .navigationDestination(item: $selectedProject) { project in
                ProjectDetailView(projectName: project.name, projectId: project.id, userToken: userToken.unsafelyUnwrapped)
            }
            .navigationTitle("Projects")
            .searchable(text: $searchText, prompt: "Search projects")
            .toolbar {
                // Center Picker (Owned / Member)
                ToolbarItem(placement: .principal) {
                    Picker("Category", selection: $selectedCategory) {
                        ForEach(ProjectCategory.allCases) { category in
                            Text(category.rawValue)
                        }
                    }
                    .pickerStyle(.segmented)
                    .frame(maxWidth: 220)
                }
                
//                .toolbar {
                    ToolbarItem(placement: .secondaryAction) {
                        Button(action: { userToken = nil }) {
                            Label("Sign Out", systemImage: "person.slash.fill")
                        }
                    }
//                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Picker("Sort Order", selection: $sortOrder) {
                            ForEach(SortOrder.allCases) { order in
                                Text(order.rawValue)
                            }
                        }
                    } label: {
                        Label("Sort", systemImage: "arrow.up.arrow.down")
                    }
                    .tint(.primary)
                }
            }
            .overlay {
                  if filteredProjects.isEmpty {
                      ContentUnavailableView.search
                  }
              }
        }
    }
}

struct ProjectListCard: View {
    let project: Project

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(project.name)
                .font(.title3.bold())
                .foregroundStyle(.primary)

            Text(project.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(3)

            HStack {
                Label(project.updatedAt.formatted(date: .abbreviated, time: .shortened),
                      systemImage: "clock")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                Spacer()
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(
                    LinearGradient(
                        colors: [.blue.opacity(0.15), .purple.opacity(0.15)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .shadow(color: .black.opacity(0.08), radius: 6, x: 0, y: 4)
        )
        .contentShape(RoundedRectangle(cornerRadius: 20))
    }
}

#Preview {
    ProjectsDashboard(
        projects: .init(
            ownedProjects: [
                Project(
                    id: UUID().uuidString,
                    name: "NeuralVision",
                    description: "AI-powered image classification tool for developers.",
                    createdAt: .now,
                    updatedAt: .now
                ),
                Project(
                    id: UUID().uuidString,
                    name: "Aether",
                    description: "Next-gen note syncing app with real-time collaboration.",
                    createdAt: .now.addingTimeInterval(-86400),
                    updatedAt: .now.addingTimeInterval(-3600)
                )
            ],
            memberProjects: [
                Project(
                    id: UUID().uuidString,
                    name: "EchoCloud",
                    description: "Distributed cloud sound storage system.",
                    createdAt: .now.addingTimeInterval(-172800),
                    updatedAt: .now.addingTimeInterval(-7200)
                )
            ]
        ), userToken: .constant(nil)
    )
}
