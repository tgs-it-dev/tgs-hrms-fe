import { useEffect } from 'react';
import UserProfileComponent from '../components/UserProfile/UserProfile';

export default function ProfilePage() {
  useEffect(() => {
    document.title = 'Profile — TGS HRMS';
  }, []);

  return <UserProfileComponent />;
}
