// React componenti
import { StoriesList } from './components/StoriesList';
import RequireAuth from '../../components/RequireAuth';

export default function StoryListPage() {
  return (
    <RequireAuth>
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center text-purple-900 mb-12">
          Hikayeler
        </h1>
        <StoriesList />
      </div>
    </RequireAuth>
  );
}
