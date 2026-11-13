import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useMeetingContext } from '../../context/MeetingContext';
import { ApiService } from '../../services/api';
import { LogIn, LogOut, CheckCircle2 } from 'lucide-react';

interface GoogleJwtPayload {
  sub: string; // Google User ID
  name: string;
  email: string;
  picture: string;
}

export const GoogleAuthButton: React.FC = () => {
  const { currentUser, setCurrentUser } = useMeetingContext();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) return;

      const decoded: GoogleJwtPayload = jwtDecode(credentialResponse.credential);
      console.log('Google login success for:', decoded.email);

      // Lưu / Đồng bộ vào PostgreSQL database
      const dbUser = await ApiService.syncGoogleUser({
        googleId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        avatarUrl: decoded.picture,
      });

      const updatedUser = {
        id: dbUser?.user?.id || decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: (dbUser?.user?.role || 'chairperson') as any,
        title: dbUser?.user?.title || 'Lãnh đạo / Chủ tọa',
        avatarUrl: decoded.picture,
        isGoogleAuth: true,
      };

      setCurrentUser(updatedUser);
      localStorage.setItem('minutely_google_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Lỗi giải mã Google Token:', err);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('minutely_google_user');
    setCurrentUser({
      id: 'p1',
      name: 'Nguyễn Văn Hùng',
      email: 'hung.nguyen@vinacorp.vn',
      role: 'chairperson',
      title: 'Chủ tịch HĐQT',
      isGoogleAuth: false,
    });
  };

  if (currentUser.isGoogleAuth) {
    return (
      <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1">
        {currentUser.avatarUrl ? (
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-7 h-7 rounded-full border border-indigo-400 object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            {currentUser.name[0]}
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
            {currentUser.name}
          </p>
          <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
            {currentUser.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer ml-1"
          title="Đăng xuất tài khoản Google"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="google-auth-wrapper">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.error('Google Sign In Failed')}
        theme="filled_black"
        shape="pill"
        size="small"
        text="signin_with"
      />
    </div>
  );
};
