//
//  ContentView.swift
//  foligo
//
//  Created by Ryan Nair on 10/25/25.
//

import SwiftUI

enum FoligoAPI {
    static let baseURL = URL(string: "https://api.foligo.tech").unsafelyUnwrapped
    
    fileprivate static func getProjects(authToken: String) async -> Projects? {
        var request = URLRequest(url: baseURL.appendingPathComponent("/api/users/me/projects"))
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        
        guard let data = try? await URLSession.shared.data(for: request).0 else {
            return nil
        }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        do {
            let projects = try decoder.decode(Projects.self, from: data)
            return projects
        } catch {
            print(error)
            return nil
        }
    }
}

struct Projects: Codable {
    let ownedProjects: [Project]
    let memberProjects: [Project]
}

struct Project: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let description: String
    let createdAt: Date
    let updatedAt: Date
}

struct ContentView: View {
    @State private var showSplashScreen = true
    @State private var projects: Projects?
    @AppStorage("userToken") private var userToken: String?
    
    var body: some View {
        ZStack {
            if showSplashScreen {
                SplashScreen(showSplashScreen: $showSplashScreen)
                    .transition(.opacity)
                    .task {
                        if let userToken {
                            projects = await FoligoAPI.getProjects(authToken: userToken)
                        }
                    }
            }
            else if userToken == nil {
                AuthView(userToken: $userToken)
                    .preferredColorScheme(.dark)
            }
            else if let projects {
                ProjectsDashboard(projects: projects, userToken: $userToken)
            }
            else {
                OnboardingView(userToken: $userToken)
                    .ignoresSafeArea()
            }
        }
    }
}

#Preview {
    ContentView()
}
