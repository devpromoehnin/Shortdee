"""Audio feature extraction with Librosa.

TODO(Phase 4.3): RMS energy, spectral centroid, speech rate, silence,
excitement-peak detection.
"""


class AudioAnalyzer:
    def extract_features(self, audio_path: str) -> dict:
        raise NotImplementedError("Phase 4.3")
