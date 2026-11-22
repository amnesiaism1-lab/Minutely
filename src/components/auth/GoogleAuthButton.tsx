import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useMeetingContext } from '../../context/MeetingContext';
import { ApiService } from '../../services/api';
import { LogOut } from 'lucide-react';

interface GoogleJwtPayload {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

export const GoogleAuthButton: React.FC = () => {
  const { currentUser, setCurrentUser } = useMeetingContext();

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    try {
      if (!credentialResponse.credential) return;

      const decoded: GoogleJwtPayload = jwtDecode(credentialResponse.credential);

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
        role: (dbUser?.user?.role || 'chairperson') as
          | 'chairperson'
          | 'secretary'
          | 'member'
          | 'admin',
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
      <div className="flex h-9 items-center gap-2 rounded-full border border-slate-300/80 bg-white pl-1 pr-1.5 shadow-2xs">
        {currentUser.avatarUrl ? (
          <img
            src={currentUser.avatarUrl}
            alt=""
            className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1d4ed8] text-xs font-bold text-white">
            {currentUser.name[0]}
          </div>
        )}
        <div className="hidden min-w-0 text-left sm:block">
          <p className="max-w-[125px] truncate text-[12.5px] font-semibold leading-tight text-slate-900">
            {currentUser.name}
          </p>
          <p className="max-w-[125px] truncate text-[11px] leading-tight text-slate-600">
            {currentUser.email}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="ml-0.5 cursor-pointer rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600"
          title="Đăng xuất tài khoản Google"
          aria-label="Đăng xuất"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.85} />
        </button>
      </div>
    );
  }

  return (
    <div className="google-auth-wrapper flex items-center [&_iframe]:!rounded-lg">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.error('Google Sign In Failed')}
        theme="outline"
        shape="rectangular"
        size="medium"
        text="signin_with"
      />
    </div>
  );
};
