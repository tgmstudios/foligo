//
//  ColorSelection.swift
//  foligo
//
//  Created by Ryan Nair on 10/25/25.
//

import SwiftUI

struct ColorPreferences {
    var primary: Color = Color(hex: "#007AFF")
    var secondary: Color = Color(hex: "#8E8E93")
    var accent: Color = Color(hex: "#FF9500")
    var background: Color = Color(hex: "#F2F2F7")
    var text: Color = Color(hex: "#1C1C1E")
    
    var primaryHex: String { primary.toHex() ?? "#000000" }
    var secondaryHex: String { secondary.toHex() ?? "#000000" }
    var accentHex: String { accent.toHex() ?? "#000000" }
    var backgroundHex: String { background.toHex() ?? "#000000" }
    var textHex: String { text.toHex() ?? "#000000" }
}

// MARK: - View
struct WebsitePaletteBuilderView: View {
    @Binding var palette: ColorPreferences
    
    // Animation state for floating blob & CTA
    @State private var floatBlob = false
    @State private var pulseCTA = false
    @State private var rotateHeader = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                header
                livePreview
                pickersSection
                sendPayloadButton
            }
            .padding(20)
            .frame(maxWidth: .infinity)
        }
        .background(palette.background.ignoresSafeArea())
        .onAppear {
            // kick off subtle animations
            withAnimation(.easeInOut(duration: 6).repeatForever(autoreverses: true)) {
                floatBlob.toggle()
            }
            withAnimation(.easeInOut(duration: 1.25).repeatForever(autoreverses: true)) {
                pulseCTA.toggle()
            }
            withAnimation(.easeInOut(duration: 5).repeatForever(autoreverses: true)) {
                rotateHeader.toggle()
            }
        }
    }
    
    // MARK: - Header
    private var header: some View {
        VStack(spacing: 8) {
            Text("Build your website’s vibe")
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .multilineTextAlignment(.center)
                .foregroundColor(palette.primary)
                .shadow(color: palette.primary.opacity(0.18), radius: 12, x: 0, y: 6)
                .rotationEffect(.degrees(rotateHeader ? 1.25 : -1.25))
                .animation(.easeInOut(duration: 5).repeatForever(autoreverses: true), value: rotateHeader)
        }
        .padding(.top, 12)
    }
    
    // MARK: - Live Preview Card
    private var livePreview: some View {
        ZStack {
            // card background
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            palette.background.opacity(0.95),
                            palette.background.opacity(0.9)
                        ]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .shadow(color: Color.black.opacity(0.12), radius: 18, x: 0, y: 8)
            
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 12) {
                    // Animated gradient header badge
                    ZStack {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(
                                LinearGradient(
                                    gradient: Gradient(colors: [palette.primary, palette.accent]),
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 84, height: 40)
                            .rotationEffect(.degrees(rotateHeader ? 2 : -2))
                            .animation(.easeInOut(duration: 5).repeatForever(autoreverses: true), value: rotateHeader)
                        
                        Text("Brand")
                            .font(.subheadline.bold())
                            .foregroundColor(palette.primary.contrastingTextColor())
                    }
                    
                    VStack(alignment: .leading) {
                        Text("Your Website")
                            .font(.title2.weight(.semibold))
                            .foregroundColor(palette.primary)
                        
                        Text("A short, stylish tagline that sells the vibe.")
                            .font(.callout)
                            .foregroundColor(palette.text.opacity(0.9)) // Use the new text color
                    }
                    
                    Spacer()
                    
                    // tiny preview pill showing hex codes
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(palette.primaryHex).font(.caption.monospaced())
                        Text(palette.accentHex).font(.caption.monospaced())
                    }
                    .foregroundColor(palette.secondary) // Use the new secondary color
                }
                
                // Floating blob + hero illustration feel (animated)
                ZStack {
                    // subtle decorative circles behind content
                    Circle()
                        .fill(palette.accent.opacity(0.08))
                        .frame(width: 160, height: 160)
                        .offset(x: floatBlob ? -40 : 20, y: floatBlob ? -18 : -8)
                        .blur(radius: 8)
                        .animation(.interpolatingSpring(stiffness: 30, damping: 12), value: floatBlob)
                    
                    Circle()
                        .fill(palette.primary.opacity(0.06))
                        .frame(width: 120, height: 120)
                        .offset(x: floatBlob ? 40 : -20, y: floatBlob ? 12 : 28)
                        .blur(radius: 10)
                        .animation(.easeInOut(duration: 5).repeatForever(autoreverses: true), value: floatBlob)
                    
                    // The moving "blob" that uses accent color
                    BlobShape()
                        .fill(
                            LinearGradient(gradient: Gradient(colors: [palette.accent, palette.primary]), startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .frame(width: 140, height: 100)
                        .rotationEffect(.degrees(floatBlob ? 8 : -10))
                        .offset(x: floatBlob ? -12 : 12, y: floatBlob ? -6 : 6)
                        .opacity(0.95)
                        .scaleEffect(1.03)
                        .shadow(color: Color.black.opacity(0.08), radius: 12, x: 0, y: 8)
                        .animation(.interpolatingSpring(stiffness: 40, damping: 10), value: floatBlob)
                        .offset(x: 25)
                    
                    // Sample content column
                    VStack(alignment: .leading) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 40, weight: .semibold))
                            .foregroundColor(palette.accent.contrastingTextColor())
                            .padding(10)
                            .background(palette.accent.opacity(0.2))
                            .clipShape(Circle())
                            .shadow(color: palette.accent.opacity(0.12), radius: 6, x: 0, y: 4)
                            .offset(x: -15)
                        
                        // CTA button (animated pulse)
                        HStack {
                            Spacer()
                            Button(action: {}) {
                                Text("Call to Action")
                                    .font(.headline.weight(.bold))
                                    .padding(.horizontal, 22)
                                    .padding(.vertical, 12)
                                    .background(
                                        Capsule()
                                            .fill(palette.primary)
                                            .shadow(color: palette.primary.opacity(0.22), radius: 12, x: 0, y: 8)
                                    )
                                    .foregroundColor(palette.primary.contrastingTextColor())
                                    .scaleEffect(pulseCTA ? 1.03 : 1.0)
                                    .animation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true), value: pulseCTA)
                            }
                            .offset(x: 20, y: -20)
                            Spacer()
                        }
                    }
                    .padding(.horizontal, 18)
                }
                .frame(maxWidth: .infinity)
                
                // Accessibility / Information Row
                HStack(spacing: 12) {
                    contrastBadge
                    VStack(alignment: .leading, spacing: 6) {
                        Text("What these colors do")
                            .font(.subheadline.bold())
                            .foregroundColor(palette.text)
                        Text("- Primary: tone for buttons, headers and major accents\n- Secondary: subtitles, borders, less-prominent UI\n- Accent: highlights, icons, micro-interactions\n- Background: the canvas for your content\n- Text: body and headings readability")
                            .font(.caption)
                            .foregroundColor(palette.secondary)
                    }
                    Spacer()
                }
            }
            .padding(22)
        }
        .frame(maxWidth: 900)
        .frame(minHeight: 380)
        .padding(4)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(palette.background)
                .opacity(1.0)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(Color.primary.opacity(0.03), lineWidth: 0.5)
        )
    }
    
    // MARK: - Contrast Badge
    private var contrastBadge: some View {
        let ratio = palette.text.contrastRatio(against: palette.background)
        return HStack(spacing: 8) {
            VStack {
                Text(String(format: "%.1fx", ratio))
                    .font(.headline.monospaced())
                    .bold()
                    .foregroundColor(palette.text)
                Text("contrast")
                    .font(.caption2)
                    .foregroundColor(palette.secondary) // Use new secondary color
            }
            .padding(8)
            .background(roundedBadgeBackground(for: ratio))
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 4)
        }
    }
    
    private func roundedBadgeBackground(for ratio: Double) -> Color {
        // Friendly color coding for contrast
        switch ratio {
        case ..<3.0:
            return Color.red.opacity(0.14)
        case 3.0..<4.5:
            return Color.yellow.opacity(0.12)
        default:
            return Color.green.opacity(0.12)
        }
    }
    
    // MARK: - Pickers Section
    private var pickersSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Each row uses ColorPicker and shows the hex string + small swatch
            colorPickerRow(title: "Primary Color", description: "Sets the tone for buttons, links, and headings.", color: $palette.primary)
            colorPickerRow(title: "Secondary Color", description: "Used for subtitles, borders, and less-prominent UI.", color: $palette.secondary)
            colorPickerRow(title: "Accent Color", description: "Used for icons, badges and micro-interactions.", color: $palette.accent)
            colorPickerRow(title: "Background Color", description: "The canvas for your pages — light or dark.", color: $palette.background)
            colorPickerRow(title: "Text Color", description: "The main color for body copy and headings.", color: $palette.text)
        }
        .padding(.vertical, 6)
    }
    
    // MARK: - Send Payload Button (for demonstration)
    private var sendPayloadButton: some View {
        Button {
            withAnimation(.easeInOut(duration: 0.5)) {
                palette = ColorPreferences()
            }
        } label: {
            HStack {
                Spacer()
                Text("Reset Colors")
                    .font(.headline)
                    .padding(.vertical, 12)
                Spacer()
            }
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(palette.primary)
            )
            .foregroundColor(palette.primary.contrastingTextColor())
            .shadow(color: palette.primary.opacity(0.18), radius: 12, x: 0, y: 8)
        }
        .padding(.top, 6)
    }
    
    private func colorPickerRow(title: String, description: String, color: Binding<Color>) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(color.wrappedValue)
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.black)
                }
                Spacer()
                
                // Small swatch + hex display
                HStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(color.wrappedValue)
                        .frame(width: 38, height: 28)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.primary.opacity(0.06), lineWidth: 1)
                        )
                        .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 4)
                    
                    Text(color.wrappedValue.toHex() ?? "--")
                        .font(.caption.monospaced())
                        .foregroundColor(.secondary)
                        .frame(minWidth: 76, alignment: .trailing)
                }
            }
            
            HStack {
                ColorPicker("", selection: color, supportsOpacity: false)
                    .labelsHidden()
                    .frame(width: 44, height: 44)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.primary.opacity(0.04), lineWidth: 1)
                    )
                
                // "Quick sample" of how it might be used
                sampleUsage(for: title, color: color.wrappedValue)
                Spacer()
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.02), radius: 6, x: 0, y: 4)
        )
    }
    
    // small inline sample that changes with the selected color
    private func sampleUsage(for title: String, color: Color) -> some View {
        switch title {
        case "Primary Color":
            return AnyView(
                HStack {
                    Text("Button")
                        .font(.subheadline.weight(.semibold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(color)
                        .foregroundColor(color.contrastingTextColor())
                        .clipShape(Capsule())
                }
            )
        case "Secondary Color":
            return AnyView(
                HStack {
                    Text("Subtitle")
                        .font(.subheadline)
                        .foregroundColor(color)
                }
            )
        case "Accent Color":
            return AnyView(
                HStack(spacing: 10) {
                    Image(systemName: "heart.fill")
                        .foregroundColor(color)
                    Text("Icon")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            )
        case "Background Color":
            return AnyView(
                HStack {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(color)
                        .frame(width: 44, height: 28)
                        .overlay(Text("BG").font(.caption).foregroundColor(color.contrastingTextColor()))
                }
            )
        case "Text Color":
            return AnyView(
                HStack {
                    Text("Aa")
                        .font(.title3.weight(.semibold))
                        .foregroundColor(color)
                }
            )
        default:
            return AnyView(EmptyView())
        }
    }
}

// MARK: - BlobShape (cute decorative shape)
private struct BlobShape: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let w = rect.width
        let h = rect.height
        p.move(to: CGPoint(x: 0.5*w, y: 0.05*h))
        p.addCurve(to: CGPoint(x: 0.95*w, y: 0.3*h),
                   control1: CGPoint(x: 0.78*w, y: -0.02*h),
                   control2: CGPoint(x: 1.05*w, y: 0.12*h))
        p.addCurve(to: CGPoint(x: 0.75*w, y: 0.85*h),
                   control1: CGPoint(x: 0.85*w, y: 0.48*h),
                   control2: CGPoint(x: 0.95*w, y: 0.72*h))
        p.addCurve(to: CGPoint(x: 0.15*w, y: 0.95*h),
                   control1: CGPoint(x: 0.55*w, y: 0.98*h),
                   control2: CGPoint(x: 0.32*w, y: 1.05*h))
        p.addCurve(to: CGPoint(x: 0.05*w, y: 0.35*h),
                   control1: CGPoint(x: -0.05*w, y: 0.82*h),
                   control2: CGPoint(x: -0.05*w, y: 0.5*h))
        p.addCurve(to: CGPoint(x: 0.5*w, y: 0.05*h),
                   control1: CGPoint(x: 0.3*w, y: 0.12*h),
                   control2: CGPoint(x: 0.2*w, y: -0.02*h))
        p.closeSubpath()
        return p
    }
}

// MARK: - Color Utilities (hex conversions & contrast)
extension Color {
    // Create Color from hex string
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var value: UInt64 = 0
        scanner.scanHexInt64(&value)
        
        let r, g, b: UInt64
        if hex.count == 6 {
            r = (value & 0xFF0000) >> 16
            g = (value & 0x00FF00) >> 8
            b = value & 0x0000FF
            self.init(
                .sRGB,
                red: Double(r) / 255.0,
                green: Double(g) / 255.0,
                blue: Double(b) / 255.0,
                opacity: 1.0
            )
            return
        }
        // fallback to black
        self = .black
    }
    
    // Convert Color to HEX string
    func toHex() -> String? {
        let ui = UIColor(self)
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0
        guard ui.getRed(&red, green: &green, blue: &blue, alpha: &alpha) else { return nil }
        let r = Int(round(red * 255))
        let g = Int(round(green * 255))
        let b = Int(round(blue * 255))
        return String(format: "#%02X%02X%02X", r, g, b)
    }
    
    // Return a light/dark contrasting foreground color (white or black)
    func contrastingTextColor() -> Color {
        return self.isDarkColor() ? .white : .black
    }
    
    // approximate luminance -> boolean dark
    func isDarkColor() -> Bool {
        let ui = UIColor(self)
        var r: CGFloat = 0
        var g: CGFloat = 0
        var b: CGFloat = 0
        var a: CGFloat = 0
        ui.getRed(&r, green: &g, blue: &b, alpha: &a)
        // sRGB luminance
        let lum = 0.2126 * Double(r) + 0.7152 * Double(g) + 0.0722 * Double(b)
        return lum < 0.5
    }
    
    // Contrast ratio between self and another color (WCAG-like approximation)
    func contrastRatio(against other: Color) -> Double {
        func luminance(_ c: Color) -> Double {
            let ui = UIColor(c)
            var r: CGFloat = 0
            var g: CGFloat = 0
            var b: CGFloat = 0
            var a: CGFloat = 0
            ui.getRed(&r, green: &g, blue: &b, alpha: &a)
            func adjust(_ v: Double) -> Double {
                return (v <= 0.03928) ? (v / 12.92) : pow((v + 0.055) / 1.055, 2.4)
            }
            let R = adjust(Double(r))
            let G = adjust(Double(g))
            let B = adjust(Double(b))
            return 0.2126 * R + 0.7152 * G + 0.0722 * B
        }
        let L1 = luminance(self)
        let L2 = luminance(other)
        let lighter = max(L1, L2)
        let darker = min(L1, L2)
        if darker == 0 { return 100.0 }
        return (lighter + 0.05) / (darker + 0.05)
    }
}

// MARK: - Preview

#Preview {
    WebsitePaletteBuilderView(palette: .constant(ColorPreferences()))
        .preferredColorScheme(.light)
}
