import { useState } from 'react';
import { PermissionRequest, CameraCapture, StickerEditor, SuccessScreen } from './components';
import type { AppState } from './types';

function App() {
  const [state, setState] = useState<AppState>({
    stage: 'permission',
    photoData: null,
    placedStickers: [],
    loading: false,
  });

  const handlePermissionGranted = () => {
    setState({ ...state, stage: 'camera' });
  };

  const handlePhotoTaken = (photoData: string) => {
    setState({ ...state, stage: 'editor', photoData });
  };

  const handleSave = (finalImage: string) => {
    setState({ ...state, stage: 'success', photoData: finalImage });
  };

  const handleReset = () => {
    setState({
      stage: 'camera',
      photoData: null,
      placedStickers: [],
      loading: false,
    });
  };

  const handleBackToCamera = () => {
    setState({
      stage: 'camera',
      photoData: null,
      placedStickers: [],
      loading: false,
    });
  };

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      {state.stage === 'permission' && (
        <PermissionRequest onPermissionGranted={handlePermissionGranted} />
      )}
      {state.stage === 'camera' && (
        <CameraCapture onPhotoTaken={handlePhotoTaken} />
      )}
      {state.stage === 'editor' && state.photoData && (
        <StickerEditor
          photoData={state.photoData}
          onSave={handleSave}
          onBackClick={handleBackToCamera}
        />
      )}
      {state.stage === 'success' && state.photoData && (
        <SuccessScreen
          imageData={state.photoData}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

export default App;
