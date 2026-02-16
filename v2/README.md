# Online bill splitter v2
This is a bill splitter app that lets you track and split expenses easily! 

Try version 2 now! https://ezsplit.netlify.app/v2/app.html 

### Overview of new & improved features
| 🚀 Feature                  |📝 Description |
|----------------------------|----------------|
| 🗂️ **Session Management**   | Supports both single and multi-session use cases (e.g., for multi-day trips). |
| 💰 **Expense Management**   | All expense data is stored in `localStorage` by default and can be synced with Firebase. |
| 🔄 **Data Persistence & Sharing** | Data is saved in `localStorage` for persistence across reloads. Users can generate a shareable link for the current session to enable real-time collaboration. |
| 🛠️ **Supabase Integration** | Includes a dedicated API layer for Supabase session and expense CRUD operations. Supports multi-session structure (parent/child). Real-time updates ensure changes are reflected in both Firebase and the UI. |

### New User interface
[Video Demo](https://youtu.be/HlLPL3xnAek)
|Single session             | Multi-session    |
|----------------------------|----------------|
|![image](https://github.com/user-attachments/assets/7726f126-7ac1-4618-9bd5-8a2ea308be80)|![image](https://github.com/user-attachments/assets/4824690c-788b-4c3b-95fb-a4e89514d675)
|

