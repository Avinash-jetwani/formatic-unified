import { fetchApi } from './api';

// Types for user data
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalForms: number;
  totalSubmissions: number;
  recentActivity: {
    date: string;
    action: string;
    details: string;
  }[];
}

/**
 * Get the current user's profile from JWT token
 */
const getCurrentUser = async (): Promise<UserProfile> => {
  try {
    // Try to extract from auth token first since we might not have a /users/me endpoint
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Use the token payload data
        return {
          id: payload.sub || payload.id,
          name: payload.name || 'User',
          email: payload.email || '',
          role: payload.role || 'CLIENT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } catch (tokenError) {
        console.error('Failed to parse token:', tokenError);
      }
    }
    
    // Fallback to API call if token parsing failed
    try {
      const response = await fetchApi<UserProfile>('/users/me', {
        method: 'GET'
      });
      return response;
    } catch (apiError) {
      console.error('Failed to fetch user profile from API:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

/**
 * Get user-specific stats by aggregating data from various endpoints
 */
const getUserStats = async (): Promise<UserStats> => {
  try {
    // Get the current user first to know their ID and role
    const user = await getCurrentUser();
    
    // Fetch forms and submissions for this user
    const [forms, submissions] = await Promise.all([
      fetchApi<any[]>('/forms', { method: 'GET' }),
      fetchApi<any[]>('/submissions', { method: 'GET' })
    ]);
    
    // Filter forms if user is not an admin
    const userForms = user.role === 'SUPER_ADMIN' ? forms : forms.filter(form => form.userId === user.id);
    
    // Generate recent activity from forms and submissions
    const recentActivity = generateRecentActivity(forms, submissions);
    
    return {
      totalForms: userForms.length,
      totalSubmissions: submissions.length,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

/**
 * Generate recent activity from forms and submissions data
 */
const generateRecentActivity = (forms: any[], submissions: any[]) => {
  const activities: {
    date: string;
    action: string;
    details: string;
  }[] = [];
  
  // Recent form activities
  if (forms && forms.length > 0) {
    const recentForms = [...forms]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
      
    recentForms.forEach(form => {
      activities.push({
        date: form.createdAt,
        action: 'Form Created',
        details: `Created form: ${form.name || form.title || 'Untitled Form'}`
      });
      
      if (form.updatedAt && form.updatedAt !== form.createdAt) {
        activities.push({
          date: form.updatedAt,
          action: 'Form Updated',
          details: `Updated form: ${form.name || form.title || 'Untitled Form'}`
        });
      }
    });
  }
  
  // Recent submission activities
  if (submissions && submissions.length > 0) {
    const recentSubmissions = [...submissions]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.submittedAt);
        const dateB = new Date(b.createdAt || b.submittedAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
      
    recentSubmissions.forEach(submission => {
      const formName = submission.formName || submission.form?.name || `Form ${submission.formId}`;
      activities.push({
        date: submission.createdAt || submission.submittedAt,
        action: 'Form Submitted',
        details: `New submission for: ${formName}`
      });
    });
  }
  
  // Sort all activities by date (newest first)
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10); // Limit to 10 most recent
};

export const userService = {
  getCurrentUser,
  getUserStats
}; 