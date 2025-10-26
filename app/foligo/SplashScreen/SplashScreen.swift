//
//  SplashScreen.swift
//  foligo
//
//  Created by Ryan Nair on 10/25/25.
//

import SwiftUI

struct SplashScreen: View {
    @Binding var showSplashScreen: Bool

    @State private var strokeProgress: CGFloat = 0
    @State private var isFilled = false
    @State private var glowRadius: CGFloat = 0
    @State private var exitScale: CGFloat = 1
    @State private var exitOpacity: Double = 1

    var body: some View {
        ZStack {
            Color(red: 0.02, green: 0.0, blue: 0.1) // Deep, dark blue
                .ignoresSafeArea()

            ZStack {
                // Fill (appears after a delay)
                FoligoText()
                    .fill(LinearGradient(
                        gradient: Gradient(colors: [Color.cyan, Color.blue]),
                        startPoint: .top,
                        endPoint: .bottom
                    ))
                    .opacity(isFilled ? 1 : 0)

                // Stroke (draws first)
                FoligoText()
                    .trim(from: 0, to: strokeProgress)
                    .stroke(
                        LinearGradient(
                            gradient: Gradient(colors: [.indigo, .cyan, .white]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 6, lineCap: .round, lineJoin: .round)
                    )
            }
            .frame(width: 300, height: 150) // Icon size
            .shadow(color: .cyan, radius: glowRadius) // The glow effect
            .scaleEffect(exitScale) // Used for the exit animation
        }
        .opacity(exitOpacity) // Used for the exit animation
        .onAppear {
            // Run the complex, chained animation sequence
            runAnimationSequence()
        }
    }
    
    func runAnimationSequence() {
        // 1. Animate the stroke drawing
        withAnimation(.easeInOut(duration: 1.5)) {
            strokeProgress = 1.0
        }

        // 2. Animate the fill, starting slightly before the stroke finishes
        withAnimation(.easeIn(duration: 0.5).delay(1)) {
            isFilled = true
        }

        // 3. Animate the glow appearing, after the stroke is done
        withAnimation(.easeInOut(duration: 1.0).delay(1.5)) {
            glowRadius = 30
        } completion: {
            // 4. Once glow is visible, make it pulse
            withAnimation(.easeInOut(duration: 0.5).repeatForever(autoreverses: true)) {
                glowRadius = 40
            }
            
            // 5. After a short pause, trigger the exit transition
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                // Stop the pulsing glow by resetting it (optional, but clean)
                withAnimation(.easeOut(duration: 0.5)) {
                    glowRadius = 0
                }
                
                // Animate the "zoom and fade" exit
                withAnimation(.easeIn(duration: 1.0)) {
                    exitScale = 50
                    exitOpacity = 0
                } completion: {
                    // 6. Tell the ContentView to remove this view
                    showSplashScreen = false
                }
            }
        }
    }
}


#Preview {
    SplashScreen(showSplashScreen: .constant(false))
}
