import axios from 'axios';

// 使用相对路径，让 Vite 代理处理请求
const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 如果是 FormData，移除默认的 Content-Type，让浏览器自动设置
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const responseData = response.data;
    if (responseData && responseData.code === "200") {
      return {
        success: true,
        code: responseData.code,
        message: responseData.message,
        data: responseData.data,
        detail: responseData.detail
      };
    }
    return Promise.reject({
      success: false,
      code: responseData?.code || 400,
      message: responseData?.message || '请求失败',
      data: responseData?.data || null,
      detail: responseData?.detail || null
    });
  },
  (error) => {
    if (error.response) {
      const responseData = error.response.data;
      return Promise.reject({
        success: false,
        code: responseData?.code || error.response.status,
        message: responseData?.message || '请求失败',
        data: responseData?.data || null,
        detail: responseData?.detail || error.message
      });
    }
    return Promise.reject({
      success: false,
      code: 500,
      message: '网络错误',
      data: null,
      detail: '请检查网络连接'
    });
  }
);

export const chatAPI = {
  chat(message, conversationId) {
    return apiClient.post('/api/v2/ai/chat', {
      message,
      conversationId: String(conversationId)
    });
  },

  streamChat(message, conversationId, onData, onComplete, onError, signal) {
    const token = localStorage.getItem('token');
    
    // 由于 EventSource 只支持 GET 请求，我们需要使用 fetch + ReadableStream
    // 这是标准的 SSE 客户端实现方式
    const controller = new AbortController();
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    fetch('/api/v2/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        message,
        conversationId: String(conversationId)
      }),
      signal: controller.signal
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function processChunk() {
        return reader.read().then(({ done, value }) => {
          if (done) {
            console.log('SSE 流已结束');
            // 当流结束时，即使没有收到 [DONE] 信号，也调用完成回调
            onComplete && onComplete();
            return;
          }

          if (value) {
            buffer += decoder.decode(value, { stream: true });
            console.log('收到 SSE 数据:', buffer);
            
            // 处理多个 data 块连在一起的情况，例如 data:嗨data:~
            let processedBuffer = buffer;
            while (processedBuffer.includes('data:')) {
              const dataIndex = processedBuffer.indexOf('data:');
              if (dataIndex === -1) break;
              
              // 找到下一个 data: 的位置或行尾
              const nextDataIndex = processedBuffer.indexOf('data:', dataIndex + 5);
              let dataChunk;
              if (nextDataIndex === -1) {
                dataChunk = processedBuffer.slice(dataIndex + 5);
                processedBuffer = '';
              } else {
                dataChunk = processedBuffer.slice(dataIndex + 5, nextDataIndex);
                processedBuffer = processedBuffer.slice(nextDataIndex);
              }
              
              const dataStr = dataChunk.trim();
              if (dataStr === '[DONE]') {
                console.log('收到 [DONE] 信号');
                onComplete && onComplete();
                return;
              }
              if (dataStr) {
                try {
                  // 直接使用 dataStr，因为后端直接返回 SseEmitter 的内容
                  // 即使只返回一个字，也直接追加
                  onData && onData(dataStr);
                } catch (e) {
                  console.error('解析 SSE 数据失败:', e);
                }
              }
            }
            
            // 保存剩余的未处理数据
            buffer = processedBuffer;
          }

          return processChunk();
        }).catch(error => {
          console.error('读取 SSE 数据失败:', error);
          // 即使发生错误，也要调用完成回调，确保 UI 状态正确更新
          onComplete && onComplete();
        });
      }

      return processChunk();
    })
    .catch(error => {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('SSE 连接错误:', error);
      onError && onError(error);
    });
  },

  createConversation() {
    return apiClient.post('/api/v2/ai/create');
  },

  getHistory(conversationId) {
    return apiClient.get(`/api/v2/history/${conversationId}`);
  },

  getConversationList() {
    return apiClient.get('/api/v2/history/list');
  },

  speak(text) {
    return apiClient.post('/api/v2/ai/speak', { text: text }, {

    });
  },

  updateConversationTitle(conversationId, title) {
    return apiClient.post('/api/v2/ai/title', {
      conversationId: conversationId,
      title: title
    });
  },

  deleteConversation(conversationId) {
    return apiClient.get(`/api/v2/history/clear/${conversationId}`);
  }
};

export const userAPI = {
  getUserDetail() {
    return apiClient.post('/api/v1/user/detail/detail/get');
  },

  updateUserDetail(userDetail) {
    return apiClient.post('/api/v1/user/detail/detail/update', userDetail);
  },

  getAvatar() {
    return apiClient.post('/api/v1/user/detail/avatar/get');
  },

  updateAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/api/v1/user/detail/avatar/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  getPosterDetail(userId) {
    return apiClient.post(`/api/v1/user/detail/detail/get/user?userId=${userId}`);
  }
};

export const postAPI = {
  uploadPost(formData) {
    return apiClient.post('/api/v2/posting/upload', formData);
  },
  
  searchPosting(keyword, pageNum, pageSize) {
    return apiClient.post(`/api/v2/searching/search?keyword=${encodeURIComponent(keyword)}&pageNum=${encodeURIComponent(pageNum)}&pageSize=${encodeURIComponent(pageSize)}`);
  },
  
  getPostingEncapsulate(postingId) {
    return apiClient.post(`/api/v2/searching/encapsulate?postingId=${postingId}`);
  },
  
  getPosting(postingId) {
    return apiClient.post(`/api/v2/posting/get?postingId=${postingId}`);
  },
  
  isLiked(postingId) {
    return apiClient.post(`/api/v2/posting/isLiked?postingId=${postingId}`);
  },
  
  isCollected(postingId) {
    return apiClient.post(`/api/v2/posting/isCollected?postingId=${postingId}`);
  },
  
  // 点赞帖子
  likePosting(postingId) {
    return apiClient.post(`/api/v2/posting/like?postingId=${postingId}`);
  },
  
  // 收藏帖子
  collectionPosting(postingId) {
    return apiClient.post(`/api/v2/posting/collection?postingId=${postingId}`);
  },
  
  // 取消点赞帖子
  cancelLikePosting(postingId) {
    return apiClient.post(`/api/v2/posting/cancelLike?postingId=${postingId}`);
  },
  
  // 取消收藏帖子
  cancelCollectionPosting(postingId) {
    return apiClient.post(`/api/v2/posting/cancelCollection?postingId=${postingId}`);
  },
  
  // 获取帖子的收藏数
  getCollectionCount(postingId) {
    return apiClient.post(`/api/v2/posting/getCollectionCount?postingId=${postingId}`);
  },
  
  // 获取帖子的点赞数
  getLikeCount(postingId) {
    return apiClient.post(`/api/v2/posting/getLikeCount?postingId=${postingId}`);
  },
  
  // 获取自己的帖子
  getMyPosting() {
    return apiClient.post('/api/v2/posting/getMyPosting');
  },
  
  // 删除帖子
  deletePosting(postingId) {
    return apiClient.post(`/api/v2/posting/delete?postingId=${postingId}`);
  }
};

export const adminAPI = {
  uploadFiles(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return apiClient.post('/api/yachiyo/168/mini/admin/upload', formData);
  }
};

export const commentAPI = {
  // 添加评论
  addComment(commentRequest) {
    return apiClient.post('/api/v1/auth/add-comment', commentRequest);
  },
  
  // 获取评论列表
  getCommentList(postingId) {
    return apiClient.post('/api/v1/auth/get-comment-list', postingId);
  },
  
  // 删除评论
  deleteComment(commentId) {
    return apiClient.post('/api/v1/auth/delete-comment', commentId);
  }
};

export default apiClient;
