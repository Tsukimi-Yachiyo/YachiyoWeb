import { ref, computed } from 'vue'
import { userAPI } from '../services/api'
import type { SearchUserItem, UserRelationListResponse } from '../types/api'

export function useFriends() {
  // 状态
  const follows = ref<number[]>([])
  const followers = ref<number[]>([])
  const friends = ref<SearchUserItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 互相关注的好友ID列表
  const mutualFollowIds = computed(() => {
    return follows.value.filter(id => followers.value.includes(id))
  })

  // 加载关注和粉丝列表
  const loadRelations = async () => {
    isLoading.value = true
    error.value = null
    try {
      const [followsRes, followersRes] = await Promise.all([
        userAPI.getUserFollows(),
        userAPI.getUserFollowers(),
      ])

      if (followsRes.success && followsRes.data) {
        follows.value = followsRes.data
      }
      if (followersRes.success && followersRes.data) {
        followers.value = followersRes.data
      }

      // 加载好友详细信息
      await loadFriendsDetails()
    } catch (err: any) {
      console.error('加载关系列表失败:', err)
      error.value = err.message || '加载失败'
    } finally {
      isLoading.value = false
    }
  }

  // 加载好友详细信息
  const loadFriendsDetails = async () => {
    try {
      // 这里简化处理，实际项目中可以批量获取用户详情
      const friendList: SearchUserItem[] = []
      for (const userId of mutualFollowIds.value) {
        try {
          const res = await userAPI.getInteractionDetail(userId)
          if (res.success && res.data) {
            friendList.push({
              userName: res.data.userName,
              userAvatar: res.data.userAvatar,
              followerCount: res.data.followerCount,
              isFollowing: res.data.isFollowing,
              isFollowed: res.data.isFollowed,
              id: userId, // 添加用户ID
            } as any)
          }
        } catch (e) {
          console.error(`获取用户${userId}详情失败:`, e)
        }
      }
      friends.value = friendList
    } catch (err) {
      console.error('加载好友详情失败:', err)
    }
  }

  // 检查是否是好友（互相关注）
  const isFriend = (userId: number): boolean => {
    return mutualFollowIds.value.includes(userId)
  }

  // 关注用户
  const followUser = async (userId: number) => {
    try {
      await userAPI.followUser(userId)
      // 刷新列表
      await loadRelations()
      return true
    } catch (err) {
      console.error('关注失败:', err)
      return false
    }
  }

  // 检查是否关注了某个用户
  const isFollowing = (userId: number): boolean => {
    return follows.value.includes(userId)
  }

  // 检查是否被某个用户关注
  const isFollowedBy = (userId: number): boolean => {
    return followers.value.includes(userId)
  }

  return {
    follows,
    followers,
    friends,
    mutualFollowIds,
    isLoading,
    error,
    loadRelations,
    loadFriendsDetails,
    isFriend,
    followUser,
    isFollowing,
    isFollowedBy,
  }
}
