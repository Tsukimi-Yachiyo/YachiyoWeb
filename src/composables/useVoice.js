import { ref } from 'vue';
import { chatAPI } from '../services/api.js';

export function useVoice() {
  const voiceStatusMap = ref(new Map());
  const currentPlayingAudio = ref(null);

  const isVoiceClickable = (text) => {
    const status = voiceStatusMap.value.get(text) || { isLoading: false, audio: null };
    if (status.isLoading) return false;
    if (currentPlayingAudio.value && currentPlayingAudio.value !== status.audio) return false;
    return true;
  };

  const getVoiceStatus = (text) => {
    return voiceStatusMap.value.get(text) || { isLoading: false, audio: null };
  };

  const playVoice = async (text) => {
    if (!isVoiceClickable(text)) return;

    const existingStatus = voiceStatusMap.value.get(text);
    if (existingStatus?.audio) {
      currentPlayingAudio.value = existingStatus.audio;
      await existingStatus.audio.play();
      return;
    }

    voiceStatusMap.value.set(text, { isLoading: true, audio: null });

    try {
      const result = await chatAPI.speak(text);
      if (result.success && result.data) {
        const base64Data = result.data;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mp3' });

        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);

        voiceStatusMap.value.set(text, { isLoading: false, audio });
        currentPlayingAudio.value = audio;

        audio.onended = () => {
          currentPlayingAudio.value = null;
        };

        await audio.play();
      } else {
        console.error('播放语音失败:', result.message);
        voiceStatusMap.value.set(text, { isLoading: false, audio: null });
      }
    } catch (error) {
      console.error('播放语音失败:', error);
      voiceStatusMap.value.set(text, { isLoading: false, audio: null });
    }
  };

  return {
    isVoiceClickable,
    getVoiceStatus,
    playVoice
  };
}
