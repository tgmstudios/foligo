//
//  AuthView.swift
//  foligo
//
//  Created by Ryan Nair on 10/25/25.
//

import SwiftUI

// MARK: - Auth State Enum
enum AuthState {
    case login, signUp
}

// MARK: - Auth View
struct AuthView: View {
    @State private var viewModel: AuthViewModel
    @Binding var userToken: String?
    @Namespace private var animation
    
    @State private var animateGradient = false
    
    internal init(userToken: Binding<String?>) {
        self.viewModel = AuthViewModel()
        self._userToken = userToken
    }
    
    var body: some View {
        ZStack {
            // Background Gradient
            LinearGradient( colors: [Color.blue.opacity(0.4), Color.purple.opacity(0.6)],
                            startPoint: animateGradient ? .topLeading : .bottomLeading,
                            endPoint: animateGradient ? .bottomTrailing : .topTrailing)
            .ignoresSafeArea()
            .onAppear {
                withAnimation(.linear(duration: 4.0).repeatForever(autoreverses: true)) {
                    animateGradient.toggle()
                }
            }
            
            VStack(spacing: 20) {
                
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text(viewModel.authState == .login ? "Welcome Back" : "Get Started")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                    Text(viewModel.authState == .login ? "Sign in to your account" : "Create a new account")
                        .font(.system(size: 18, weight: .medium, design: .rounded))
                        .foregroundStyle(.white.opacity(0.7))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.bottom, 10)
                
                // Custom Segmented Control
                HStack(spacing: 0) {
                    SegmentButton(
                        title: "Login",
                        isActive: viewModel.authState == .login,
                        namespace: animation
                    ) {
                        // The animation is preserved here in the view
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            viewModel.authState = .login
                        }
                    }
                    
                    SegmentButton(
                        title: "Sign Up",
                        isActive: viewModel.authState == .signUp,
                        namespace: animation
                    ) {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            viewModel.authState = .signUp
                        }
                    }
                }
                .glassEffect(.clear, in: .rect(cornerRadius: 12))
                
                VStack(spacing: 15) {
                    if viewModel.authState == .signUp {
                        CustomTextField(
                            iconName: "person.fill",
                            placeholder: "Full Name",
                            text: $viewModel.name // Bind to ViewModel
                        )
                        .transition(.asymmetric(
                            insertion: .move(edge: .leading).combined(with: .opacity),
                            removal: .move(edge: .leading).combined(with: .opacity)
                        ))
                    }
                    
                    CustomTextField(
                        iconName: "envelope.fill",
                        placeholder: "Email",
                        text: $viewModel.email
                    )
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    
                    CustomTextField(
                        iconName: "lock.fill",
                        placeholder: "Password",
                        text: $viewModel.password,
                        isSecure: true
                    )
                    
                    if viewModel.authState == .signUp {
                        CustomTextField(
                            iconName: "lock.fill",
                            placeholder: "Confirm Password",
                            text: $viewModel.confirmPassword,
                            isSecure: true
                        )
                        .transition(.asymmetric(
                            insertion: .move(edge: .trailing).combined(with: .opacity),
                            removal: .move(edge: .trailing).combined(with: .opacity)
                        ))
                    }
                }
                .animation(.spring(response: 0.4, dampingFraction: 0.8), value: viewModel.authState)
                
                Spacer(minLength: 20)

                Button(action: {
                    Task {
                        let response = await viewModel.handleAuthAction()
                        if let token = response?.token {
                            self.userToken = token
                        }
                    }
                }) {
                    // Show ProgressView when loading
                    if viewModel.isLoading {
                        ProgressView()
                            .tint(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 55)
                            .background(Color.blue.opacity(0.8))
                            .cornerRadius(14)
                    } else {
                        Text(viewModel.authState == .login ? "Login" : "Create Account")
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 55)
                            .background(Color.blue)
                            .cornerRadius(14)
                            .shadow(color: .blue.opacity(0.5), radius: 10, y: 5)
                    }
                }
                .disabled(viewModel.isLoading)
                .scaleEffect(1)
            }
            .padding(30)
            .glassEffect(.clear, in: .rect(cornerRadius: 25)) // iOS 19 API
            .padding(20)
        }
        .foregroundStyle(.white)
        .alert(
            viewModel.alertTitle,
            isPresented: $viewModel.isShowingAlert
        ) {
            Button("OK") {
                viewModel.isShowingAlert = false
            }
        } message: {
            Text(viewModel.alertMessage)
        }
    }
}

private struct SegmentButton: View {
    let title: String
    let isActive: Bool
    let namespace: Namespace.ID
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Text(title)
                    .font(.system(size: 16, weight: .medium, design: .rounded))
                    .foregroundStyle(isActive ? .white : .white.opacity(0.6))
                
                if isActive {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.blue)
                        .frame(height: 4)
                        .matchedGeometryEffect(id: "highlighter", in: namespace)
                } else {
                    Rectangle()
                        .fill(Color.clear)
                        .frame(height: 4)
                }
            }
            .padding(.horizontal)
            .padding(.top, 10)
            .padding(.bottom, 5)
        }
    }
}

private struct CustomTextField: View {
    let iconName: String
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    
    var body: some View {
        HStack(spacing: 15) {
            Image(systemName: iconName)
                .font(.system(size: 18, weight: .medium))
                .foregroundStyle(.white.opacity(0.7))
                .frame(width: 20)
            
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
            }
        }
        .padding(15)
        .glassEffect(.clear, in: .rect(cornerRadius: 12))
    }
}

#Preview {
    AuthView(userToken: .constant(nil))
        .preferredColorScheme(.dark)
}
