import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Send, Plus, Search, X, Users, MessageCircle, Settings, Hash, MoreVertical, Crown, UserMinus, Home, User, Trophy, Briefcase, ArrowLeft, Bell } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Chat {
  _id: string;
  participants: {
    _id: string;
    username?: string;
    profilePicture?: string;
    role?: 'player' | 'team' | 'admin';
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  }[];
  lastMessage?: {
    content: string | {
      text: string;
      media?: Array<{
        type: 'image' | 'video';
        url: string;
        publicId: string;
      }>;
    };
    sender: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

interface Group {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  creator: {
    _id: string;
    username: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  };
  members: Array<{
    user: {
      _id: string;
      username: string;
      profile?: {
        displayName?: string;
        avatar?: string;
      };
    };
    role: 'admin' | 'member';
    joinedAt: string;
  }>;
  memberCount: number;
  lastMessage?: {
    content: string | {
      text: string;
      media?: Array<{
        type: 'image' | 'video';
        url: string;
        publicId: string;
      }>;
    };
    sender: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

interface Message {
  _id: string;
  content: {
    text: string;
    media?: Array<{
      type: 'image' | 'video';
      url: string;
      publicId: string;
    }>;
  };
  sender: {
    _id: string;
    username: string;
    profilePicture?: string;
    profile?: {
      displayName?: string;
      avatar?: string;
    };
  };
  createdAt: string;
  inviteData?: {
    type: 'roster' | 'staff';
    inviteId: string;
    teamId: string;
    game?: string;
    role?: string;
    inGameName?: string;
    message?: string;
  };
}

interface User {
  _id: string;
  username: string;
  profilePicture?: string;
  profile?: {
    avatar?: string;
    banner?: string;
    displayName?: string;
  };
  role?: 'player' | 'team';
  userType?: 'player' | 'team' | 'admin';
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'dm' | 'groups'>('dm');
  
  // DM State
  const [dmChats, setDmChats] = useState<Chat[]>([]);
  const [selectedDmChat, setSelectedDmChat] = useState<Chat | null>(null);
  
  // Groups State
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Shared State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Group Creation State
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: ''
  });
  const [groupSettingsForm, setGroupSettingsForm] = useState({
    name: '',
    description: ''
  });
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<User[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [groupSettingsMemberSearchQuery, setGroupSettingsMemberSearchQuery] = useState('');
  const [groupSettingsMemberSearchResults, setGroupSettingsMemberSearchResults] = useState<User[]>([]);
  const [groupSettingsMemberSearching, setGroupSettingsMemberSearching] = useState(false);
  const [memberDropdownOpen, setMemberDropdownOpen] = useState<string | null>(null);
  const [showAddMemberSearch, setShowAddMemberSearch] = useState(false);

  // Handle user parameter from URL to automatically open chat
  useEffect(() => {
    const targetUserId = searchParams.get('user');
    if (targetUserId && activeSection === 'dm') {
      // Check if we already have a chat with this user
      const existingChat = dmChats.find(chat => {
        const chatUserId = chat._id.replace('direct_', '');
        return chatUserId === targetUserId;
      });
      
      if (existingChat) {
        setSelectedDmChat(existingChat);
        // Clear the URL parameter
        setSearchParams({});
      } else {
        // Fetch user details and create a new chat
        fetchUserAndCreateChat(targetUserId);
      }
    }
  }, [searchParams, activeSection, dmChats, user, setSearchParams]);

  const fetchUserAndCreateChat = async (targetUserId: string) => {
    try {
      console.log('Fetching user details for:', targetUserId);
      const response = await axios.get(`/api/users/${targetUserId}`);
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        const targetUser = response.data.data?.user || response.data.user;
        console.log('Target user data:', targetUser);
        console.log('Target user username:', targetUser?.username);
        console.log('Target user profile:', targetUser?.profile);
        console.log('Target user userType:', targetUser?.userType);
        
        const newChat: Chat = {
          _id: `direct_${targetUserId}`,
          participants: [
            { _id: user?._id || '', username: user?.username, profilePicture: user?.profilePicture, role: user?.role, profile: user?.profile },
            { 
              _id: targetUserId, 
              username: targetUser?.username || targetUser?.profile?.displayName || 'Unknown User', 
              profilePicture: targetUser?.profile?.avatar || '', 
              role: targetUser?.userType || 'player', 
              profile: targetUser?.profile || {}
            }
          ],
          lastMessage: null,
          unreadCount: 0
        };
        
        console.log('Created new chat:', newChat);
        console.log('Other participant:', getOtherParticipant(newChat));
        
        setSelectedDmChat(newChat);
        // Clear the URL parameter
        setSearchParams({});
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Create chat with minimal info if user fetch fails
      const newChat: Chat = {
        _id: `direct_${targetUserId}`,
        participants: [
          { _id: user?._id || '', username: user?.username, profilePicture: user?.profilePicture, role: user?.role, profile: user?.profile },
          { _id: targetUserId, username: 'Unknown User', profilePicture: '', role: 'player', profile: {} }
        ],
        lastMessage: null,
        unreadCount: 0
      };
      setSelectedDmChat(newChat);
      // Clear the URL parameter
      setSearchParams({});
    }
  };

  // Fetch both DM and Groups data when component mounts
  useEffect(() => {
    fetchDmChats();
    fetchGroups();
  }, []);

  // Also fetch when switching sections (for immediate UI updates)
  useEffect(() => {
    if (activeSection === 'dm') {
      fetchDmChats();
    } else {
      fetchGroups();
    }
  }, [activeSection]);

  useEffect(() => {
    if (selectedDmChat) {
      fetchDmMessages(selectedDmChat._id);
    } else if (selectedGroup) {
      fetchGroupMessages(selectedGroup._id);
    }
  }, [selectedDmChat, selectedGroup]);

  // Leave previous chat rooms when switching
  useEffect(() => {
    if (socket) {
      // Leave all chat rooms when component unmounts or when switching
      return () => {
        socket.emit('leave-chat-room', 'all');
      };
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (data: { chatId: string; message: Message }) => {
        console.log('Received new message:', data);
        
        // Play notification sound if message is not from current user and chat is not open
        const isCurrentUser = data.message.sender._id === user?._id;
        const isChatOpen = (selectedDmChat && data.chatId === selectedDmChat._id) || 
                          (selectedGroup && data.chatId === selectedGroup._id);
        
        if (!isCurrentUser && !isChatOpen) {
          // Play notification sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(err => console.log('Could not play notification sound:', err));
        }
        
        // Update messages if this chat is currently selected
        if (isChatOpen) {
          setMessages(prev => [...prev, data.message]);
          // Mark messages as read immediately if chat is open
          markMessagesAsRead(data.chatId, activeSection === 'dm' ? 'direct' : 'group');
        } else {
          // If chat is not open, dispatch event to update navbar count
          window.dispatchEvent(new CustomEvent('messageRead'));
        }
        
        // Update both DM and Groups lists regardless of current section
        // Check if this is a DM chat (starts with 'direct_')
        if (data.chatId.startsWith('direct_')) {
          setDmChats(prev => {
            const updated = prev.map(chat => {
              if (chat._id === data.chatId) {
                return {
                  ...chat,
                  lastMessage: {
                    content: data.message.content,
                    sender: data.message.sender._id,
                    createdAt: data.message.createdAt
                  },
                  unreadCount: chat.unreadCount + (selectedDmChat?._id === data.chatId ? 0 : 1)
                };
              }
              return chat;
            });
            
            // Move to top if there are unread messages OR if it's the current user's message
            const chatWithNewMessage = updated.find(chat => chat._id === data.chatId);
            const isCurrentUserMessage = data.message.sender._id === user?._id;
            if (chatWithNewMessage && (chatWithNewMessage.unreadCount > 0 || isCurrentUserMessage)) {
              // Move chat with new message to top
              const filtered = updated.filter(chat => chat._id !== data.chatId);
              return [chatWithNewMessage, ...filtered];
            }
            return updated;
          });
        } else {
          // This is a group message
          setGroups(prev => {
            const updated = prev.map(group => {
              if (group._id === data.chatId) {
                return {
                  ...group,
                  lastMessage: {
                    content: data.message.content,
                    sender: data.message.sender._id,
                    createdAt: data.message.createdAt
                  },
                  unreadCount: group.unreadCount + (selectedGroup?._id === data.chatId ? 0 : 1)
                };
              }
              return group;
            });
            
            // Move to top if there are unread messages OR if it's the current user's message
            const groupWithNewMessage = updated.find(group => group._id === data.chatId);
            const isCurrentUserMessage = data.message.sender._id === user?._id;
            if (groupWithNewMessage && (groupWithNewMessage.unreadCount > 0 || isCurrentUserMessage)) {
              // Move group with new message to top
              const filtered = updated.filter(group => group._id !== data.chatId);
              return [groupWithNewMessage, ...filtered];
            }
            return updated;
          });
        }
      });

      return () => {
        socket.off('newMessage');
      };
    }
  }, [socket, selectedDmChat, selectedGroup]);

  const fetchDmChats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/messages/recent');
      if (response.data.success && response.data.data?.conversations) {
        setDmChats(response.data.data.conversations);
      } else {
        setDmChats([]);
      }
    } catch (error) {
      console.error('Error fetching DM chats:', error);
      setDmChats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/messages/rooms');
      if (response.data.success && response.data.chatRooms) {
        setGroups(response.data.chatRooms);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDmMessages = async (chatId: string) => {
    try {
      const userId = chatId.replace('direct_', '');
      const response = await axios.get(`/api/messages/direct/${userId}`);
      if (response.data.success) {
        const messages = response.data.messages || response.data.data?.messages || [];
        setMessages(messages);
        
        // Mark messages as read when chat is opened
        await markMessagesAsRead(chatId, 'direct');
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching DM messages:', error);
      setMessages([]);
    }
  };

  const fetchGroupMessages = async (groupId: string) => {
    try {
      const response = await axios.get(`/api/messages/rooms/${groupId}`);
      if (response.data.success) {
        const messages = response.data.messages || response.data.data?.messages || [];
        setMessages(messages);
        
        // Mark messages as read when group is opened
        await markMessagesAsRead(groupId, 'group');
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching group messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      if (activeSection === 'dm' && selectedDmChat) {
        const userId = selectedDmChat._id.replace('direct_', '');
        const response = await axios.post('/api/messages/direct', {
          recipientId: userId,
          text: messageText
        });
        
        const newMessageData = response.data.data.message;
        setMessages(prev => [...prev, newMessageData]);
        
        // Emit socket event for real-time delivery
        if (socket) {
          socket.emit('send-message', {
            recipientId: userId,
            message: newMessageData
          });
        }
        
        // Update chat list and move to top
        setDmChats(prev => {
          // Check if this chat already exists in the list
          const existingChatIndex = prev.findIndex(chat => chat._id === selectedDmChat._id);
          
          if (existingChatIndex !== -1) {
            // Chat exists, update it and move to top
            const updated = prev.map(chat => {
              if (chat._id === selectedDmChat._id) {
                return {
                  ...chat,
                  lastMessage: {
                    content: newMessageData.content,
                    sender: newMessageData.sender._id,
                    createdAt: newMessageData.createdAt
                  },
                  unreadCount: 0
                };
              }
              return chat;
            });
            
            // Move current chat to top since it has the latest message
            const currentChat = updated.find(chat => chat._id === selectedDmChat._id);
            if (currentChat) {
              const filtered = updated.filter(chat => chat._id !== selectedDmChat._id);
              return [currentChat, ...filtered];
            }
            return updated;
          } else {
            // Chat doesn't exist, add it to the top of the list
            const newChatEntry = {
              ...selectedDmChat,
              lastMessage: {
                content: newMessageData.content,
                sender: newMessageData.sender._id,
                createdAt: newMessageData.createdAt
              },
              unreadCount: 0
            };
            
            return [newChatEntry, ...prev];
          }
        });
      } else if (activeSection === 'groups' && selectedGroup) {
        const response = await axios.post('/api/messages/group', {
          chatRoomId: selectedGroup._id,
          text: messageText
        });
        
        const newMessageData = response.data.data.message;
        setMessages(prev => [...prev, newMessageData]);
        
        // Emit socket event for real-time delivery
        if (socket) {
          socket.emit('send-message', {
            chatRoomId: selectedGroup._id,
            message: newMessageData
          });
        }
        
                 // Update group list without re-sorting
         setGroups(prev => {
           const updated = prev.map(group => {
             if (group._id === selectedGroup._id) {
               return {
                 ...group,
                 lastMessage: {
                   content: newMessageData.content,
                   sender: newMessageData.sender._id,
                   createdAt: newMessageData.createdAt
                 },
                 unreadCount: 0
               };
             }
             return group;
           });
           
           // Move current group to top since it has the latest message
           const currentGroup = updated.find(group => group._id === selectedGroup._id);
           if (currentGroup) {
             const filtered = updated.filter(group => group._id !== selectedGroup._id);
             return [currentGroup, ...filtered];
           }
           return updated;
         });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
    }
  };

  // Handle invite response (accept/decline)
  const handleInviteResponse = async (messageId: string, response: 'accept' | 'decline') => {
    try {
      const result = await axios.post(`/api/messages/${messageId}/invite-response`, {
        response
      });
      
      if (result.data.success) {
        // Add the response message to the conversation
        if (result.data.data.responseMessage) {
          setMessages(prev => [...prev, result.data.data.responseMessage]);
        }
        
        // Show success message
        console.log(`Invitation ${response}d successfully`);
      }
    } catch (error) {
      console.error('Error responding to invite:', error);
    }
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;

    try {
      const memberIds = selectedMembers.map(member => member._id);
      
      const response = await axios.post('/api/messages/rooms', {
        name: groupForm.name.trim(),
        description: groupForm.description.trim(),
        memberIds: memberIds
      });

      if (response.data.success) {
        const newGroup = response.data.data.chatRoom;
        setGroups(prev => [newGroup, ...prev]);
        setShowCreateGroup(false);
        setGroupForm({ name: '', description: '' });
        setSelectedMembers([]);
        setMemberSearchQuery('');
        setMemberSearchResults([]);
        setActiveSection('groups');
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get(`/api/users?search=${encodeURIComponent(query)}`);
      setSearchResults(response.data.data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const searchMembers = async (query: string) => {
    if (!query.trim()) {
      setMemberSearchResults([]);
      return;
    }

    setMemberSearching(true);
    try {
      const url = `/api/users?search=${encodeURIComponent(query)}`;
      console.log('Making API call to:', url);
      const response = await axios.get(url);
      console.log('Search response:', response.data);
      // Filter out current user and already selected members
      console.log('Current user ID:', user?._id);
      console.log('All users from search:', response.data.data.users);
      console.log('Selected members:', selectedMembers);
      
      const filteredUsers = response.data.data.users.filter((searchedUser: User) => {
        const isNotCurrentUser = searchedUser._id !== user?._id;
        const isNotAlreadySelected = !selectedMembers.some(selected => selected._id === searchedUser._id);
        console.log(`User ${searchedUser.username}: isNotCurrentUser=${isNotCurrentUser}, isNotAlreadySelected=${isNotAlreadySelected}`);
        return isNotCurrentUser && isNotAlreadySelected;
      });
      console.log('Filtered users:', filteredUsers);
      setMemberSearchResults(filteredUsers || []);
      console.log('Setting member search results to:', filteredUsers || []);
    } catch (error) {
      console.error('Error searching members:', error);
      setMemberSearchResults([]);
    } finally {
      setMemberSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if ((window as any).searchTimeout) {
      clearTimeout((window as any).searchTimeout);
    }
    
    (window as any).searchTimeout = setTimeout(() => {
      searchUsers(query);
    }, 300);
  };

  const markMessagesAsRead = async (chatId: string, messageType: 'direct' | 'group') => {
    try {
      const response = await axios.post('/api/messages/mark-read', {
        chatId,
        messageType
      });
      
      // Only update unread count in the UI without refreshing the entire list
      if (messageType === 'direct') {
        setDmChats(prev => prev.map(chat => 
          chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
        ));
      } else {
        setGroups(prev => prev.map(group => 
          group._id === chatId ? { ...group, unreadCount: 0 } : group
        ));
      }

      // Dispatch event to notify navbar to refresh unread count
      window.dispatchEvent(new CustomEvent('messageRead'));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleMemberSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    console.log('Search query:', query);
    setMemberSearchQuery(query);
    
    if ((window as any).memberSearchTimeout) {
      clearTimeout((window as any).memberSearchTimeout);
    }
    
    (window as any).memberSearchTimeout = setTimeout(() => {
      searchMembers(query);
    }, 300);
  };

  const handleMemberSelect = (member: User) => {
    console.log('Selecting member:', member);
    setSelectedMembers(prev => {
      const newMembers = [...prev, member];
      console.log('Updated selected members:', newMembers);
      return newMembers;
    });
    console.log('Clearing search query and results');
    setMemberSearchQuery('');
    setMemberSearchResults([]);
  };

  const removeMember = (memberId: string) => {
    setSelectedMembers(prev => prev.filter(member => member._id !== memberId));
  };

  const openGroupSettings = (group: Group) => {
    setGroupSettingsForm({
      name: group.name,
      description: group.description || ''
    });
    setShowGroupSettings(true);
  };

  const searchGroupSettingsMembers = async (query: string) => {
    if (!query.trim()) {
      setGroupSettingsMemberSearchResults([]);
      return;
    }

    setGroupSettingsMemberSearching(true);
    try {
      const response = await axios.get(`/api/users?search=${encodeURIComponent(query)}`);
      // Filter out current user and already existing members
      const filteredUsers = response.data.data.users.filter((searchedUser: User) => 
        searchedUser._id !== user?._id && 
        !selectedGroup?.members.some(member => member.user._id === searchedUser._id)
      );
      setGroupSettingsMemberSearchResults(filteredUsers || []);
    } catch (error) {
      console.error('Error searching members for group settings:', error);
      setGroupSettingsMemberSearchResults([]);
    } finally {
      setGroupSettingsMemberSearching(false);
    }
  };

  const handleGroupSettingsMemberSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setGroupSettingsMemberSearchQuery(query);
    
    if ((window as any).groupSettingsMemberSearchTimeout) {
      clearTimeout((window as any).groupSettingsMemberSearchTimeout);
    }
    
    (window as any).groupSettingsMemberSearchTimeout = setTimeout(() => {
      searchGroupSettingsMembers(query);
    }, 300);
  };

  const addMemberToGroup = async (member: User) => {
    if (!selectedGroup) return;

    try {
      const response = await axios.post(`/api/messages/rooms/${selectedGroup._id}/members`, {
        memberId: member._id
      });

      if (response.data.success) {
        // Update the selected group with new member
        const updatedGroup = response.data.data.chatRoom;
        setSelectedGroup(updatedGroup);
        
        // Update groups list
        setGroups(prev => prev.map(group => 
          group._id === selectedGroup._id ? updatedGroup : group
        ));

        setGroupSettingsMemberSearchQuery('');
        setGroupSettingsMemberSearchResults([]);
      }
    } catch (error) {
      console.error('Error adding member to group:', error);
    }
  };

  const removeMemberFromGroup = async (memberId: string) => {
    if (!selectedGroup) return;

    try {
      const response = await axios.delete(`/api/messages/rooms/${selectedGroup._id}/members/${memberId}`);

      if (response.data.success) {
        // Update the selected group
        const updatedGroup = response.data.data.chatRoom;
        setSelectedGroup(updatedGroup);
        
        // Update groups list
        setGroups(prev => prev.map(group => 
          group._id === selectedGroup._id ? updatedGroup : group
        ));
      }
    } catch (error) {
      console.error('Error removing member from group:', error);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'admin' | 'member') => {
    if (!selectedGroup) return;

    try {
      const response = await axios.put(`/api/messages/rooms/${selectedGroup._id}/members/${memberId}/role`, {
        role: newRole
      });

      if (response.data.success) {
        // Update the selected group
        const updatedGroup = response.data.chatRoom;
        setSelectedGroup(updatedGroup);
        
        // Update groups list
        setGroups(prev => prev.map(group => 
          group._id === selectedGroup._id ? updatedGroup : group
        ));
      } else {
        console.error('Failed to update member role:', response.data.message);
      }
    } catch (error: any) {
      console.error('Error updating member role:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  const updateGroupSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      const response = await axios.put(`/api/messages/rooms/${selectedGroup._id}`, {
        name: groupSettingsForm.name.trim(),
        description: groupSettingsForm.description.trim()
      });

      if (response.data.success) {
        const updatedGroup = response.data.data.chatRoom;
        setSelectedGroup(updatedGroup);
        
        // Update groups list
        setGroups(prev => prev.map(group => 
          group._id === selectedGroup._id ? updatedGroup : group
        ));

        setShowGroupSettings(false);
      }
    } catch (error) {
      console.error('Error updating group settings:', error);
    }
  };

  const handleUserSelect = (selectedUser: User) => {
    const newChat: Chat = {
      _id: `direct_${selectedUser._id}`,
      participants: [{
        _id: selectedUser._id,
        username: selectedUser.username || selectedUser.profile?.displayName,
        profilePicture: selectedUser.profilePicture || selectedUser.profile?.avatar,
        role: selectedUser.role || selectedUser.userType
      }],
      lastMessage: null,
      unreadCount: 0
    };
    
    setDmChats(prev => [newChat, ...prev]);
    setSelectedDmChat(newChat);
    setActiveSection('dm');
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const getOtherParticipant = (chat: Chat) => {
    console.log('getOtherParticipant called with chat:', chat);
    console.log('Current user ID:', user?._id);
    console.log('Chat participants:', chat?.participants);
    
    if (!user?._id || !chat?.participants || !Array.isArray(chat.participants)) {
      console.log('getOtherParticipant: Invalid chat or user data');
      return null;
    }
    
    const participant = chat.participants.find(p => p && p._id && p._id !== user._id);
    console.log('Found participant:', participant);
    
    if (!participant) {
      console.log('getOtherParticipant: No other participant found');
      return null;
    }
    
    const result = {
      ...participant,
      username: participant.username || participant.profile?.displayName || 'Unknown User'
    };
    
    console.log('getOtherParticipant returning:', result);
    return result;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDisplayName = (user: any) => {
    return user.profile?.displayName || user.username || 'Unknown User';
  };

  const getProfilePicture = (user: any) => {
    return user.profile?.avatar || user.profilePicture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzM3M0EiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjIwOTEgMTAgMjQgMTEuNzkwOSAyNCAxNEMyNCAxNi4yMDkxIDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNi4yMDkxIDE2IDE0QzE2IDExLjc5MDkgMTcuNzkwOSAxMCAyMCAxMFoiIGZpbGw9IiM2QjZCNkIiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAyMCAyNEMxNS41ODE3IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWxsPSIjNkI2QjZCIi8+Cjwvc3ZnPgo=';
  };

  const isGroupAdmin = (group: Group) => {
    return group.creator._id === user?._id || 
           group.members.some(member => member.user._id === user?._id && member.role === 'admin');
  };

  // Calculate total unread counts for tabs
  const getTotalDmUnreadCount = () => {
    return dmChats.reduce((total, chat) => total + chat.unreadCount, 0);
  };

  const getTotalGroupsUnreadCount = () => {
    return groups.reduce((total, group) => total + group.unreadCount, 0);
  };

  // Reset unread counts when switching sections (optional - for better UX)
  const resetSectionUnreadCounts = (section: 'dm' | 'groups') => {
    if (section === 'dm') {
      setDmChats(prev => prev.map(chat => ({ ...chat, unreadCount: 0 })));
    } else {
      setGroups(prev => prev.map(group => ({ ...group, unreadCount: 0 })));
    }
  };

  // Auto-scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (memberDropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
        setMemberDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [memberDropdownOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-96 bg-gray-800 rounded-lg"></div>
              <div className="md:col-span-2 h-96 bg-gray-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Messages</h1>
            <p className="text-gray-400">Please log in to view messages.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black lg:pt-20 h-screen">

      {/* Mobile Header with Back Arrow - Hidden when message is open */}
      {!selectedDmChat && !selectedGroup && (
        <div className="flex items-center px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-800 lg:hidden">
          <button 
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors mr-3"
          >
            <ArrowLeft className="h-6 w-6 text-gray-300" />
          </button>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Messages</h1>
        </div>
      )}
      
      <div className={`w-full px-2 sm:px-4 lg:px-8 py-2 lg:py-6 ${selectedDmChat || selectedGroup ? 'h-[calc(100vh-0px)]' : 'h-[calc(100vh-80px)]'} lg:h-[calc(100vh-100px)]`}>
        <div className={`grid gap-2 lg:gap-6 h-full grid-cols-1 lg:grid-cols-3`}>
          {/* Chat List */}
          <div className={`bg-black border border-gray-800 rounded-lg p-2 lg:p-6 shadow-lg flex flex-col order-1 lg:order-1 ${selectedDmChat || selectedGroup ? 'hidden lg:flex' : 'flex'}`}>
            {/* Section Tabs */}
            <div className="flex mb-3 lg:mb-6 bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => {
                  setActiveSection('dm');
                  setSelectedDmChat(null);
                  setSelectedGroup(null);
                  // Optionally reset unread counts when switching to DM section
                  // resetSectionUnreadCounts('dm');
                }}
                className={`flex items-center justify-center space-x-2 px-4 lg:px-4 py-3 lg:py-2.5 rounded-lg transition-colors duration-200 font-semibold flex-1 mobile-touch-target ${
                  activeSection === 'dm'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <MessageCircle className="h-5 w-5 lg:h-5 lg:w-5" />
                <span className="text-base lg:text-base font-bold">DM</span>
                {getTotalDmUnreadCount() > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-sm font-bold animate-pulse">
                    {getTotalDmUnreadCount()}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveSection('groups');
                  setSelectedDmChat(null);
                  setSelectedGroup(null);
                  // Optionally reset unread counts when switching to Groups section
                  // resetSectionUnreadCounts('groups');
                }}
                className={`flex items-center justify-center space-x-2 px-4 lg:px-4 py-3 lg:py-2.5 rounded-lg transition-colors duration-200 font-semibold flex-1 mobile-touch-target ${
                  activeSection === 'groups'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Users className="h-5 w-5 lg:h-5 lg:w-5" />
                <span className="text-base lg:text-base font-bold">Groups</span>
                {getTotalGroupsUnreadCount() > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-sm font-bold animate-pulse">
                    {getTotalGroupsUnreadCount()}
                  </span>
                )}
              </button>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg lg:text-xl font-bold text-white">
                {activeSection === 'dm' ? 'Direct Messages' : 'Groups'}
              </h2>
              <div className="flex space-x-2">
                {activeSection === 'dm' && (
                  <button 
                    onClick={() => setShowSearch(!showSearch)}
                    className="p-2.5 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                    title="Search users"
                  >
                    <Search className="h-5 w-5 text-gray-300" />
                  </button>
                )}
                {activeSection === 'groups' && (
                  <button 
                    onClick={() => setShowCreateGroup(true)}
                    className="p-2.5 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                    title="Create group"
                  >
                    <Plus className="h-5 w-5 text-gray-300" />
                  </button>
                )}
              </div>
            </div>

            {/* User Search (DM Section) */}
            {activeSection === 'dm' && showSearch && (
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search users by username..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 pr-10"
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
                
                {searching && (
                  <div className="mt-2 text-center text-sm text-gray-400">
                    Searching...
                  </div>
                )}
                
                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleUserSelect(user)}
                        className="w-full p-2 hover:bg-gray-800 rounded-lg text-left flex items-center space-x-3"
                      >
                        <img
                          src={getProfilePicture(user)}
                          alt={getDisplayName(user)}
                          className="w-8 h-8 rounded-lg object-cover border-2 border-gray-700"
                        />
                        <div>
                          <p className="font-medium text-sm text-white">{getDisplayName(user)}</p>
                          <p className="text-xs text-gray-400 capitalize">{user.role || user.userType}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {searchQuery && !searching && searchResults.length === 0 && (
                  <div className="mt-2 text-center text-sm text-gray-400">
                    No users found
                  </div>
                )}
              </div>
            )}

            {/* Chat/Group List */}
            <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
              {activeSection === 'dm' ? (
                // DM Chats
                dmChats.length > 0 ? (
                  dmChats.map((chat) => {
                    const otherUser = getOtherParticipant(chat);
                    if (!otherUser) return null;
                    
                    return (
                      <button
                        key={chat._id}
                        onClick={() => {
                          setSelectedDmChat(chat);
                          setSelectedGroup(null);
                        }}
                        className={`w-full p-4 lg:p-4 rounded-xl text-left mobile-touch-target border ${
                          selectedDmChat?._id === chat._id
                            ? 'bg-blue-600/20 border-blue-500/30 text-blue-300'
                            : chat.unreadCount > 0
                            ? 'bg-red-600/10 border-red-500/20 text-white hover:bg-red-600/20'
                            : 'bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-300'
                        } transition-colors duration-200`}
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={getProfilePicture(otherUser)}
                            alt={otherUser.username}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-white truncate text-base">
                                {otherUser.username}
                              </p>
                              {chat.unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-sm font-bold animate-pulse">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                            {chat.lastMessage && (
                              <p className="text-sm text-gray-400 truncate mt-1">
                                {typeof chat.lastMessage.content === 'string' 
                                  ? chat.lastMessage.content 
                                  : chat.lastMessage.content?.text || 'No message'}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }).filter(Boolean)
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <MessageCircle className="h-16 w-16 mx-auto mb-6 text-gray-500" />
                    <p className="font-medium mb-3 text-lg">No conversations yet</p>
                    <p className="text-base mb-6">Start a conversation with someone!</p>
                    <button 
                      onClick={() => setShowSearch(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                    >
                      Search Users
                    </button>
                  </div>
                )
              ) : (
                // Groups
                groups.length > 0 ? (
                  groups.map((group) => (
                    <button
                      key={group._id}
                      onClick={() => {
                        setSelectedGroup(group);
                        setSelectedDmChat(null);
                        // Join chat room for real-time messages
                        if (socket) {
                          socket.emit('join-chat-room', group._id);
                        }
                      }}
                      className={`w-full p-4 lg:p-4 rounded-xl text-left mobile-touch-target border ${
                        selectedGroup?._id === group._id
                          ? 'bg-blue-600/20 border-blue-500/30 text-blue-300'
                          : group.unreadCount > 0
                          ? 'bg-red-600/10 border-red-500/20 text-white hover:bg-red-600/20'
                          : 'bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-300'
                      } transition-colors duration-200`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                          <Hash className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-white truncate text-base">
                              {group.name}
                            </p>
                            {group.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-sm font-bold animate-pulse">
                                {group.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-sm text-gray-400 truncate">
                              {group.memberCount} members
                            </p>
                            {group.lastMessage && (
                              <>
                                <span className="text-gray-500">•</span>
                                <p className="text-sm text-gray-400 truncate">
                                  {typeof group.lastMessage.content === 'string' 
                                    ? group.lastMessage.content 
                                    : group.lastMessage.content?.text || 'No message'}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="h-16 w-16 mx-auto mb-6 text-gray-500" />
                    <p className="font-medium mb-3 text-lg">No groups yet</p>
                    <p className="text-base mb-6">Create a group to start chatting!</p>
                    <button 
                      onClick={() => setShowCreateGroup(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                    >
                      Create Group
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Chat Messages - Always show on web, only when selected on mobile */}
          <div className={`bg-black border border-gray-800 rounded-lg p-4 lg:p-6 shadow-lg flex flex-col h-full min-h-0 order-2 lg:order-2 lg:col-span-2 ${selectedDmChat || selectedGroup ? 'flex' : 'hidden lg:flex'}`}>
            {selectedDmChat || selectedGroup ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-700 mb-4">
                  <div className="flex items-center space-x-3">
                    {/* Mobile Back Button */}
                    <button 
                      onClick={() => {
                        setSelectedDmChat(null);
                        setSelectedGroup(null);
                      }}
                      className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5 text-gray-300" />
                    </button>
                    {selectedDmChat ? (
                      // DM Header
                      (() => {
                        const otherUser = getOtherParticipant(selectedDmChat);
                        if (!otherUser) return <div className="text-secondary-400">User not found</div>;
                        
                        return (
                          <>
                            <img
                              src={getProfilePicture(otherUser)}
                              alt={otherUser.username}
                              className="w-10 h-10 rounded-lg object-cover border-2 border-gray-700"
                            />
                            <div>
                              <h3 className="font-medium text-white">{otherUser.username}</h3>
                              <p className="text-sm text-gray-400 capitalize">{otherUser.role}</p>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      // Group Header
                      selectedGroup && (
                        <>
                                                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Hash className="h-5 w-5 text-white" />
                        </div>
                          <div>
                            <h3 className="font-medium text-white">{selectedGroup.name}</h3>
                            <p className="text-sm text-gray-400">{selectedGroup.memberCount} members</p>
                          </div>
                        </>
                      )
                    )}
                  </div>
                  
                                     {/* Group Actions */}
                   {selectedGroup && isGroupAdmin(selectedGroup) && (
                     <div className="flex items-center space-x-2">
                       <button 
                         onClick={() => openGroupSettings(selectedGroup)}
                         className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                         title="Group Settings"
                       >
                         <Settings className="h-4 w-4 text-gray-300" />
                       </button>
                     </div>
                   )}
                   
                   
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 mb-4 min-h-0">
                    <div className="space-y-6">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">
                          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                          <p className="text-lg font-medium">No messages yet. Start a conversation!</p>
                        </div>
                      ) : (
                        messages.map((message) => {
                        const isOwn = message.sender._id === user._id;
                        return (
                          <div
                            key={message._id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-2`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                                isOwn
                                  ? 'bg-gray-800 text-white border border-gray-700'
                                  : 'bg-gray-800 text-white border border-gray-700'
                              }`}
                            >
                              {!isOwn && selectedGroup && (
                                <p className="text-xs text-gray-300 mb-2 font-medium">
                                  {getDisplayName(message.sender)}
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                {typeof message.content === 'string' 
                                  ? message.content 
                                  : message.content?.text || 'No message'}
                              </p>
                              
                              {/* Invite response buttons */}
                              {!isOwn && message.inviteData && (
                                <div className="mt-3 flex space-x-2">
                                  <button
                                    onClick={() => handleInviteResponse(message._id, 'accept')}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleInviteResponse(message._id, 'decline')}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                              
                              <p className={`text-xs mt-2 opacity-80 ${
                                isOwn ? 'text-primary-100' : 'text-secondary-400'
                              }`}>
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                        })
                      )}
                      {/* Auto-scroll target */}
                      <div ref={messagesEndRef} className="h-4" />
                    </div>
                  </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Type a message to ${selectedDmChat ? getOtherParticipant(selectedDmChat)?.username : selectedGroup?.name}...`}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              // Empty state for web view when no message is selected
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-gray-400">
                  <MessageCircle className="h-20 w-20 mx-auto mb-6 text-gray-600" />
                  <h3 className="text-2xl font-semibold mb-3">Select a conversation</h3>
                  <p className="text-base">Choose a conversation from the left to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-secondary-950 to-secondary-900 border border-secondary-800/50 rounded-3xl p-6 shadow-large w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Create Group</h3>
                <button
                  onClick={() => {
                    setShowCreateGroup(false);
                    setGroupForm({ name: '', description: '' });
                    setSelectedMembers([]);
                    setMemberSearchQuery('');
                    setMemberSearchResults([]);
                  }}
                  className="p-2 hover:bg-secondary-800/50 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-secondary-400" />
                </button>
              </div>
              
              <form onSubmit={createGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Group Name</label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter group name..."
                    className="w-full bg-secondary-900/50 border border-secondary-700/50 rounded-xl px-4 py-3 text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Description (Optional)</label>
                  <textarea
                    value={groupForm.description}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter group description..."
                    rows={3}
                    className="w-full bg-secondary-900/50 border border-secondary-700/50 rounded-xl px-4 py-3 text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 resize-none"
                  />
                </div>

                {/* Member Selection */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Add Members</label>
                  
                  {/* Member Search */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={handleMemberSearchChange}
                      placeholder="Search users to add..."
                      className="w-full bg-secondary-900/50 border border-secondary-700/50 rounded-xl px-4 py-3 text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                    />
                    {memberSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400">
                        Searching...
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  <div className="text-xs text-secondary-500 mb-2">Debug: memberSearchResults length = {memberSearchResults.length}</div>
                  {memberSearchResults.length > 0 && (
                    <div className="mb-3 max-h-32 overflow-y-auto space-y-1">
                      <div className="text-xs text-secondary-400 mb-2">Found {memberSearchResults.length} users</div>
                      {memberSearchResults.map((member) => (
                        <button
                          key={member._id}
                          type="button"
                          onClick={() => {
                            console.log('Button clicked for member:', member);
                            handleMemberSelect(member);
                          }}
                          className="w-full p-2 hover:bg-secondary-800/50 rounded-lg text-left flex items-center space-x-3"
                        >
                          <img
                            src={getProfilePicture(member)}
                            alt={getDisplayName(member)}
                            className="w-6 h-6 rounded-lg object-cover border border-secondary-700"
                          />
                          <div>
                            <p className="font-medium text-sm text-white">{getDisplayName(member)}</p>
                            <p className="text-xs text-secondary-400 capitalize">{member.role || member.userType}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {memberSearchQuery && !memberSearching && memberSearchResults.length === 0 && (
                    <div className="text-sm text-secondary-400 text-center py-2">
                      No users found
                    </div>
                  )}

                  {/* Selected Members */}
                  {selectedMembers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-secondary-400">Selected Members ({selectedMembers.length}):</p>
                      <div className="text-xs text-secondary-500">Debug: {JSON.stringify(selectedMembers.map(m => m.username))}</div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedMembers.map((member) => (
                          <div key={member._id} className="flex items-center justify-between p-2 bg-secondary-800/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <img
                                src={getProfilePicture(member)}
                                alt={getDisplayName(member)}
                                className="w-6 h-6 rounded-lg object-cover border border-secondary-700"
                              />
                              <div>
                                <p className="font-medium text-sm text-white">{getDisplayName(member)}</p>
                                <p className="text-xs text-secondary-400 capitalize">{member.role || member.userType}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMember(member._id)}
                              className="p-1 hover:bg-secondary-700/50 rounded transition-colors"
                            >
                              <X className="h-4 w-4 text-secondary-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateGroup(false);
                      setGroupForm({ name: '', description: '' });
                      setSelectedMembers([]);
                      setMemberSearchQuery('');
                      setMemberSearchResults([]);
                    }}
                    className="flex-1 bg-secondary-800/50 text-white px-4 py-3 rounded-xl font-semibold hover:bg-secondary-700/50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-glow transition-all duration-300"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Group Settings Modal */}
        {showGroupSettings && selectedGroup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="border-b border-gray-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-6 w-6 text-blue-500" />
                    <div>
                      <h3 className="text-xl font-bold text-white">Group Settings</h3>
                      <p className="text-gray-400 text-sm">Manage your group details and members</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowGroupSettings(false);
                      setGroupSettingsForm({ name: '', description: '' });
                      setGroupSettingsMemberSearchQuery('');
                      setGroupSettingsMemberSearchResults([]);
                      setShowAddMemberSearch(false);
                    }}
                    className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col h-[calc(90vh-120px)]">
                {/* Fixed Group Info Section */}
                <div className="flex-shrink-0 p-6">
                  <form onSubmit={updateGroupSettings}>
                    <div className="space-y-4">
                      {/* Group Name with Icon */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Hash className="h-4 w-4 text-blue-500" />
                        </div>
                        <input
                          type="text"
                          value={groupSettingsForm.name}
                          onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Group Name"
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                          required
                        />
                      </div>
                      
                      {/* Description with Icon */}
                      <div className="relative">
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <MessageCircle className="h-4 w-4 text-blue-500" />
                        </div>
                        <textarea
                          value={groupSettingsForm.description}
                          onChange={(e) => setGroupSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Tell others about your group..."
                          rows={2}
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none"
                        />
                      </div>
                    </div>
                  </form>
                </div>

                {/* Members Section - Independent Container */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Members Header */}
                  <div className="flex-shrink-0 px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                          <Users className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-white">Members</h4>
                          <p className="text-xs text-gray-400">{selectedGroup.members.length} people</p>
                        </div>
                      </div>
                      {isGroupAdmin(selectedGroup) && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddMemberSearch(!showAddMemberSearch);
                            if (!showAddMemberSearch) {
                              setGroupSettingsMemberSearchQuery('');
                              setGroupSettingsMemberSearchResults([]);
                            }
                          }}
                          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors text-sm"
                        >
                          <Plus className="h-3 w-3" />
                          <span>{showAddMemberSearch ? 'Cancel' : 'Add'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Add Member Search - Show when button is clicked */}
                  {showAddMemberSearch && (
                    <div className="flex-shrink-0 px-6 pb-4">
                      <div className="bg-gray-800 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
                          <Search className="h-4 w-4" />
                          <span>Search and Add Members</span>
                        </h5>
                        
                        {/* Member Search */}
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={groupSettingsMemberSearchQuery}
                            onChange={handleGroupSettingsMemberSearchChange}
                            placeholder="Search users..."
                            className="w-full bg-gray-700 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-sm"
                          />
                          {groupSettingsMemberSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                            </div>
                          )}
                        </div>

                        {/* Search Results */}
                        {groupSettingsMemberSearchResults.length > 0 && (
                          <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                            {groupSettingsMemberSearchResults.map((member) => (
                              <button
                                key={member._id}
                                type="button"
                                onClick={() => {
                                  addMemberToGroup(member);
                                  setShowAddMemberSearch(false);
                                  setGroupSettingsMemberSearchQuery('');
                                  setGroupSettingsMemberSearchResults([]);
                                }}
                                className="w-full p-2 hover:bg-gray-700 rounded-md text-left flex items-center space-x-2 transition-colors group"
                              >
                                <img
                                  src={getProfilePicture(member)}
                                  alt={getDisplayName(member)}
                                  className="w-6 h-6 rounded-full object-cover border border-gray-600"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-white group-hover:text-blue-300 transition-colors text-sm">
                                    {getDisplayName(member)}
                                  </p>
                                  <p className="text-xs text-gray-400 capitalize">
                                    {member.role || member.userType}
                                  </p>
                                </div>
                                <Plus className="h-3 w-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Members List - Independent Scrolling Container */}
                  <div className="flex-1 overflow-y-auto px-6 pb-4">
                    <div className="space-y-2">
                      {selectedGroup.members.map((member) => (
                        <div key={member.user._id} className="group relative bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <img
                                  src={getProfilePicture(member.user)}
                                  alt={getDisplayName(member.user)}
                                  className="w-8 h-8 rounded-lg object-cover border border-gray-600 group-hover:border-blue-400 transition-colors"
                                />
                                {member.role === 'admin' && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <Crown className="h-2.5 w-2.5 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-medium text-white group-hover:text-blue-300 transition-colors text-sm">
                                    {getDisplayName(member.user)}
                                  </h5>
                                  {member.user._id === user?._id && (
                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">You</span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 mt-0.5">
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                    member.role === 'admin' 
                                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                  }`}>
                                    {member.role === 'admin' ? 'Admin' : 'Member'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(member.joinedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {isGroupAdmin(selectedGroup) && member.user._id !== user?._id && (
                              <div className="relative dropdown-container">
                                <button
                                  type="button"
                                  onClick={() => setMemberDropdownOpen(memberDropdownOpen === member.user._id ? null : member.user._id)}
                                  className="p-1.5 hover:bg-gray-600 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <MoreVertical className="h-4 w-4 text-gray-400" />
                                </button>
                                
                                {memberDropdownOpen === member.user._id && (
                                  <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
                                    <div className="py-1">
                                      {member.role === 'member' ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateMemberRole(member.user._id, 'admin');
                                            setMemberDropdownOpen(null);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                                        >
                                          <Crown className="h-3 w-3 text-yellow-400" />
                                          <span>Promote Admin</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateMemberRole(member.user._id, 'member');
                                            setMemberDropdownOpen(null);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                                        >
                                          <UserMinus className="h-3 w-3 text-gray-400" />
                                          <span>Demote Member</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          removeMemberFromGroup(member.user._id);
                                          setMemberDropdownOpen(null);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2 transition-colors"
                                      >
                                        <X className="h-3 w-3" />
                                        <span>Remove</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons - Fixed at bottom */}
                <div className="flex-shrink-0 p-6 bg-gray-900/50">
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGroupSettings(false);
                        setGroupSettingsForm({ name: '', description: '' });
                        setGroupSettingsMemberSearchQuery('');
                        setGroupSettingsMemberSearchResults([]);
                        setShowAddMemberSearch(false);
                      }}
                      className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-600 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      onClick={updateGroupSettings}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm"
                    >
                      Update Group
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Messages;
