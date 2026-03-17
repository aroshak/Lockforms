import { getUsers, getRoles } from './actions';
import { UsersClient } from './UsersClient';

export default async function UsersPage() {
    const [users, roles] = await Promise.all([getUsers(), getRoles()]);

    return <UsersClient users={users} roles={roles} />;
}
