"""Visual feature extraction (FFmpeg frames + MediaPipe + YOLOv8).

TODO(Phase 4.3): frame extraction, scene-change detection, face detection
(for 9:16 reframing), product detection.
"""


class VisualAnalyzer:
    def extract_frames(self, video_path: str, fps: float = 0.5) -> list:
        raise NotImplementedError("Phase 4.3")

    def detect_scene_changes(self, frames: list) -> list:
        raise NotImplementedError("Phase 4.3")
