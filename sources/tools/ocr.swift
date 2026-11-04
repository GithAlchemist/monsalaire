import Foundation
import Vision
import AppKit

// Usage: ocr <image> ...  -> prints recognized text per image, lines sorted top to bottom.
for path in CommandLine.arguments.dropFirst() {
    guard let img = NSImage(contentsOfFile: path),
          let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.recognitionLanguages = ["fr-FR"]
    req.usesLanguageCorrection = true
    try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
    var obs = (req.results ?? []).compactMap { o -> (CGRect, String)? in
        guard let t = o.topCandidates(1).first?.string else { return nil }
        return (o.boundingBox, t)
    }
    // Two-column aware ordering is not needed for these documents; sort by line (y desc), then x.
    obs.sort { a, b in
        let dy = a.0.midY - b.0.midY
        if abs(dy) > 0.008 { return dy > 0 }
        return a.0.minX < b.0.minX
    }
    var lines: [String] = []
    var lastY: CGFloat = 2
    var current = ""
    for (r, t) in obs {
        if abs(r.midY - lastY) > 0.008 {
            if !current.isEmpty { lines.append(current) }
            current = t
        } else {
            current += "   " + t
        }
        lastY = r.midY
    }
    if !current.isEmpty { lines.append(current) }
    print("<<<PAGE \((path as NSString).lastPathComponent)>>>")
    print(lines.joined(separator: "\n"))
}
