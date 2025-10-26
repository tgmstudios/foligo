//
//  ProjectDetailView.swift
//  foligo
//
//  Created by Ryan Nair on 10/25/25.
//

import SwiftUI

struct ProjectDetailView: View {
    let project: Project
    let animation: Namespace.ID

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                RoundedRectangle(cornerRadius: 24)
                    .fill(
                        LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .frame(height: 200)
                    .overlay(
                        VStack(alignment: .leading, spacing: 8) {
                            Text(project.name)
                                .font(.largeTitle.bold())
                                .foregroundStyle(.white)
                            Text(project.description)
                                .foregroundStyle(.white.opacity(0.9))
                        }
                        .padding(24),
                        alignment: .bottomLeading
                    )

                VStack(alignment: .leading, spacing: 10) {
                    Label("Created", systemImage: "calendar")
                    Text(project.createdAt.formatted(date: .abbreviated, time: .omitted))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    Label("Last Updated", systemImage: "clock")
                    Text(project.updatedAt.formatted(date: .abbreviated, time: .shortened))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                Spacer()
            }
            .padding(.top)
        }
        .navigationTitle("Project Details")
        .navigationBarTitleDisplayMode(.inline)
        .background(.ultraThinMaterial)
    }
}
