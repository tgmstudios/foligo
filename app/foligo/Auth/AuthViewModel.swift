//
//  AuthViewModel.swift
//  foligo
//
//  Created by Ryan Nair on 10/25/25.
//

import Foundation

// MARK: - API Data Models (from OpenAPI spec)
struct RegisterRequest: Encodable {
    let email: String
    let password: String
    let name: String
}

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct AuthResponse: Decodable, Hashable {
    let user: User
    let token: String
}

struct User: Decodable, Hashable {
    let id: String
    let email: String
    let name: String
}

// For decoding server errors
struct ApiErrorResponse: Decodable {
    let error: String
    let message: String
}

// MARK: - Auth View Model
@Observable
class AuthViewModel {
    var authState: AuthState = .login
    var name = ""
    var email = ""
    var password = ""
    var confirmPassword = ""
    
    var isLoading = false
    var isShowingAlert = false
    var alertTitle = ""
    var alertMessage = ""
    
    private let baseURL = "https://api.foligo.tech"
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    
    private func isValidEmail() throws -> Bool {
        let emailRegEx = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        
        let regex = try Regex(emailRegEx)
        return email.wholeMatch(of: regex) != nil
    }
    
    @MainActor
    func handleAuthAction() async -> AuthResponse? {
        isLoading = true
        defer { isLoading = false }
        isShowingAlert = false
        
        do {
            guard try isValidEmail() else {
                throw AuthError.emailError
            }
            
            // Password length check from API spec
            guard password.count >= 6 else {
                throw AuthError.passwordTooShort
            }
            
            if authState == .login {
                return try await login(
                    email: email,
                    password: password
                )
            } else {
                guard !name.isEmpty else {
                    throw AuthError.nameError
                }
                
                guard password == confirmPassword else {
                    throw AuthError.passwordMismatch
                }
                
                return try await register(
                    name: name,
                    email: email,
                    password: password
                )
            }
        } catch {
            let errorMessage = (error as? AuthError)?.errorDescription ?? error.localizedDescription
            self.alertTitle = "Authentication Error"
            self.alertMessage = errorMessage
            self.isShowingAlert = true
        }
        
        return nil
    }
    
    // --- Register Endpoint ---
    func register(name: String, email: String, password: String) async throws -> AuthResponse {
        guard let url = URL(string: "\(baseURL)/api/auth/register") else {
            throw AuthError.invalidURL
        }
        
        let payload = RegisterRequest(email: email, password: password, name: name)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(payload)
        
        return try await performRequest(request)
    }
    
    // --- Login Endpoint ---
    func login(email: String, password: String) async throws -> AuthResponse {
        guard let url = URL(string: "\(baseURL)/api/auth/login") else {
            throw AuthError.invalidURL
        }
        
        let payload = LoginRequest(email: email, password: password)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(payload)
        
        return try await performRequest(request)
    }
    
    // --- Reusable Request Handler ---
    private func performRequest(_ request: URLRequest) async throws -> AuthResponse {
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.invalidResponse
        }
        
        // Check for success status codes (200 for Login, 201 for Register)
        if (200...201).contains(httpResponse.statusCode) {
            do {
                let authResponse = try decoder.decode(AuthResponse.self, from: data)
                return authResponse
            } catch {
                // This indicates a mismatch between the API spec and the actual response
                throw AuthError.invalidResponse
            }
        } else {
            // Try to decode the API's specific error format
            if let errorResponse = try? decoder.decode(ApiErrorResponse.self, from: data) {
                throw AuthError.apiError(errorResponse.message)
            } else {
                // Fallback for unexpected error formats
                throw AuthError.apiError("An unknown server error occurred (Status: \(httpResponse.statusCode)).")
            }
        }
    }
}

// MARK: - Custom Auth Errors
enum AuthError: Error {
    case nameError
    case emailError
    case passwordMismatch
    case passwordTooShort
    case apiError(String)
    case invalidResponse
    case invalidURL

    var errorDescription: String {
        switch self {
        case .passwordMismatch:
            "The passwords you entered do not match."
        case .passwordTooShort:
            "Password must be at least 6 characters long."
        case .apiError(let message):
            message // Error message from the server
        case .invalidResponse:
            "The server returned an invalid or unexpected response."
        case .invalidURL:
            "There was an issue connecting to the server."
        case .nameError:
            "You didn't enter a name"
        case .emailError:
            "You didn't enter an email"
        }
    }
}
