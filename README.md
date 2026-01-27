Job Application Tracker - Chrome Extension

A Google Chrome extension that helps users track their job applications in a single place. Users can quickly add, update, search, edit, or delete their apllications.

Built as a personal project meant to make life a little easier when tracking all of my job applications. Hopefully my friends can find use in this extenion as well. 

---

##Features

- Google authenitcation using Supabase Auth
- Secure per-user data storage with Row Level Security in Supabase
- Create, edit, delete applications
- Tabs to view: Pending, Accepeted, and Rejected applications
- Search bar for searching applications to edit or delete
- Auto-fill application details from the current tab
- Keyboard shortcut to open extension
- Persistant sessions across restarts

---

Key design decisions:
- **Security first:** all database access is protected with Supabase Row Level Security
- **Clean separation of concerns:** database logic, authentication, and UI logic are separated
- **State-driven UI:** visual state always reflects application state (no hidden side effects)
- **Chrome-native functionality:** leverages extension APIs that normal web apps cannot use

---


##Tech Stack
- Frontend: Reacts + TypeScript (using Vite)
- Backend: Supabase (PostgreSQL, Auth, and RLS)
- Platform: Chrome Extension (Mainfest V3)
