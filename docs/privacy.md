# Privacy and camera processing

Paper Portal runs in your browser. It has no application backend, account system or frame-upload endpoint.

## Camera permission

Camera input starts only after an explicit action and the browser's permission process. The application requests video without microphone audio. Marker detection processes frames locally. Stopping the camera releases its media tracks.

The browser controls permission and secure-context requirements. Opening an exported HTML file does not bypass those rules. Use a supported localhost or HTTPS context when direct-file camera access is unavailable.

## Authored data

Saved JSON contains your cards, stage rules and scene content. The exported HTML player embeds that content and its runtime. Printing creates a physical copy of the corresponding cards. Those outputs do not include recorded camera video.

Review authored text before sharing. A label or stage instruction can contain personal information even when the application has no account system.

Unsaved session state is not a backup. Save a project file and keep it in your own chosen backup location.

## External services

The exported runtime does not require a detector CDN. Installing source dependencies uses npm, and opening GitHub or Buy Me a Coffee links visits those services. Those visits are separate from local marker recognition.

Use synthetic observations or printed sample markers for public bug reports where possible. Follow [SECURITY.md](../SECURITY.md) for sensitive implementation issues.
