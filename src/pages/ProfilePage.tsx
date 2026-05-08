import { useDocumentTitle } from '../hooks/useDocumentTitle';
import UserProfileComponent from '../components/UserProfile/UserProfile';

export default function ProfilePage() {
  useDocumentTitle('Profile');
  return <UserProfileComponent />;
}
