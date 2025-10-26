//
//  ContentView.swift
//  foligo
//
//  Created by Ryan Nair on 10/25/25.
//

import SwiftUI

struct ContentView: View {
    @State private var showSplashScreen = true
    @AppStorage("userToken") private var userToken: String?

    var body: some View {
        ZStack {
            if userToken == nil {
                AuthView(userToken: $userToken)
                    .preferredColorScheme(.dark)
            }
            else {
                OnboardingView(userToken: $userToken)
                    .ignoresSafeArea()
            }

            if showSplashScreen {
                SplashScreen(showSplashScreen: $showSplashScreen)
                    .transition(.opacity)
            }
        }
    }
}

#Preview {
    ContentView()
}
