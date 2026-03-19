import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { userAPI } from '../services/api.js';
import { useAuth } from './useAuth.js';

export function useUserSettings() {
  const router = useRouter();
  const { token } = useAuth();

  const userName = ref('');
  const userAvatar = ref('');
  const avatarPreview = ref('');
  const selectedFile = ref(null);

  const userIntroduction = ref('');
  const userCity = ref('');
  const userGender = ref('');
  const userPhone = ref('');
  const userBirthday = ref('');

  const isLoading = ref(false);
  const isUploading = ref(false);
  const isSavingDetail = ref(false);

  const detailError = ref('');
  const avatarError = ref('');
  const successMessage = ref('');

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  const loadUserData = async () => {
    isLoading.value = true;
    try {
      const [detailResult, avatarResult] = await Promise.all([
        userAPI.getUserDetail(),
        userAPI.getAvatar()
      ]);

      if (detailResult.success) {
        userName.value = detailResult.data.userName || '';
        userIntroduction.value = detailResult.data.userIntroduction || '';
        userCity.value = detailResult.data.userCity || '';
        userGender.value = detailResult.data.userGender || '';
        userPhone.value = detailResult.data.userPhone || '';
        if (detailResult.data.userBirthday) {
          const date = new Date(detailResult.data.userBirthday);
          userBirthday.value = date.toISOString().split('T')[0];
        }
      }

      if (avatarResult.success && avatarResult.data) {
        const avatarData = avatarResult.data;
        if (avatarData.startsWith('data:')) {
          userAvatar.value = avatarData;
        } else {
          userAvatar.value = `data:image/png;base64,${avatarData}`;
        }
        avatarPreview.value = userAvatar.value;
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const validateAvatar = (file) => {
    if (!file) {
      return '请选择图片文件';
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '仅支持 JPG、PNG、GIF 格式的图片';
    }
    if (file.size > MAX_FILE_SIZE) {
      return '图片大小不能超过 5MB';
    }
    return '';
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    avatarError.value = '';
    successMessage.value = '';

    if (!file) return;

    const error = validateAvatar(file);
    if (error) {
      avatarError.value = error;
      selectedFile.value = null;
      avatarPreview.value = userAvatar.value;
      return;
    }

    selectedFile.value = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!selectedFile.value) {
      avatarError.value = '请先选择图片';
      return;
    }

    const error = validateAvatar(selectedFile.value);
    if (error) {
      avatarError.value = error;
      return;
    }

    isUploading.value = true;
    avatarError.value = '';
    successMessage.value = '';

    try {
      const result = await userAPI.updateAvatar(selectedFile.value);
      if (result.success) {
        userAvatar.value = avatarPreview.value;
        selectedFile.value = null;
        successMessage.value = '头像上传成功';
        setTimeout(() => {
          successMessage.value = '';
        }, 3000);
      } else {
        avatarError.value = result.message || '上传失败';
      }
    } catch (error) {
      console.error('上传头像失败:', error);
      avatarError.value = error.message || '上传失败，请检查网络连接';
    } finally {
      isUploading.value = false;
    }
  };

  const saveUserDetail = async () => {
    if (!userName.value || userName.value.trim().length === 0) {
      detailError.value = '昵称不能为空';
      return;
    }
    if (userName.value.trim().length < 2) {
      detailError.value = '昵称至少需要2个字符';
      return;
    }
    if (userName.value.trim().length > 20) {
      detailError.value = '昵称最多20个字符';
      return;
    }

    isSavingDetail.value = true;
    detailError.value = '';
    successMessage.value = '';

    const userDetailData = {
      userName: userName.value.trim(),
      userIntroduction: userIntroduction.value.trim(),
      userCity: userCity.value.trim(),
      userGender: userGender.value,
      userPhone: userPhone.value.trim(),
      userBirthday: userBirthday.value ? new Date(userBirthday.value).toISOString() : null
    };

    try {
      const result = await userAPI.updateUserDetail(userDetailData);
      if (result.success) {
        localStorage.setItem('username', userName.value.trim());
        successMessage.value = '用户信息保存成功';
        setTimeout(() => {
          successMessage.value = '';
        }, 3000);
      } else {
        detailError.value = result.message || '保存失败';
      }
    } catch (error) {
      console.error('保存用户信息失败:', error);
      detailError.value = error.message || '保存失败，请检查网络连接';
    } finally {
      isSavingDetail.value = false;
    }
  };

  const goBack = () => {
    router.push('/home');
  };

  onMounted(() => {
    if (!token.value) {
      router.push('/');
      return;
    }
    loadUserData();
  });

  return {
    userName,
    userAvatar,
    avatarPreview,
    selectedFile,
    userIntroduction,
    userCity,
    userGender,
    userPhone,
    userBirthday,
    isLoading,
    isUploading,
    isSavingDetail,
    detailError,
    avatarError,
    successMessage,
    handleFileSelect,
    uploadAvatar,
    saveUserDetail,
    goBack
  };
}
