# College Event Management System

A web-based application designed to simplify the creation, organization, and management of college events. The system provides an interface for publishing events with details such as title, category, description, date, time, venue, organizer, and participant capacity.

## Features

- **Create Events:** Add events with all essential details.
- **Event Categories:** Organize events into categories such as workshops, seminars, competitions, cultural programs, and exhibitions.
- **Event Listing:** View published events.
- **Event Registration:** Support participant registration if enabled in the application.
- **Admin Authentication:** Provide administrative login where implemented.
- **Dashboard and Reports:** View event and registration summaries where implemented.
- **Database Integration:** Store event data using MongoDB.
- **Responsive Interface:** Use a modern React-based frontend.

> Note: The availability of registration, authentication, reports, search, and editing/deletion depends on the modules implemented in your current version.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Vite | Frontend development server and build tool |
| Node.js | JavaScript runtime |
| Express.js | Backend API |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| Git and GitHub | Version control and project hosting |

## Project Structure

```text
CollegeEventManagementSystem/
├── web/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env
├── .gitignore
└── README.md
```

The exact folder structure may vary depending on your implementation.

## Prerequisites

Install the following software:

- [Node.js and npm](https://nodejs.org/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)

MongoDB Compass is optional but useful for viewing database records.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/CollegeEventManagementSystem.git
cd CollegeEventManagementSystem
```

Replace `YOUR-USERNAME` with your GitHub username.

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder using the environment variable names expected by your backend code.

Example configuration:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/college_event_management
JWT_SECRET=replace_with_a_long_random_secret
```

Use a strong, private JWT secret. Add any other variables required by your actual application. Never commit the real `.env` file or passwords to GitHub.

### 3. Start the backend

Run the start script defined in `backend/package.json`. For example:

```bash
npm run dev
```

If no `dev` script exists but `server.js` is the backend entry point, use:

```bash
node server.js
```

The backend typically runs at:

```text
http://localhost:5000
```

### 4. Configure and start the frontend

Open a **second terminal** in the project root:

```bash
cd web
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

Keep the backend and frontend terminals running while using the application.

## Database Configuration

The application uses MongoDB to store event information and any additional data supported by the implemented modules.

Default local database example:

```text
mongodb://127.0.0.1:27017/college_event_management
```

Make sure the MongoDB service is running before starting the backend. Your actual database and collection names depend on the backend configuration and model definitions.

## How to Use

1. Start MongoDB.
2. Start the backend server.
3. Start the React frontend.
4. Open the frontend in your browser.
5. Enter event details in the **Create an Event** form.
6. Select a category and provide the description, date, time, venue, organizer, and capacity.
7. Click **Publish event**.
8. Verify that the event appears in the application and is saved in MongoDB.
9. Test registration, admin, search, and reporting functions if those modules are enabled.

## Testing

Test the following scenarios before submitting the assignment:

- Create an event with valid information.
- Try submitting the form with required fields missing.
- Confirm that created events remain available after refreshing the page.
- Verify saved event records in MongoDB Compass.
- Test registration and capacity limits if supported.
- Test valid and invalid admin login credentials if authentication is implemented.
- Verify search, filters, and reports if implemented.
- Check the browser console and backend terminal for errors.

## Screenshots

Add screenshots of the running application to a `screenshots/` folder in the repository if required by your assignment.

Suggested screenshots:

1. Create Event form
2. Event listing page
3. Successful event creation
4. Admin login/dashboard, if implemented
5. Event registration, if implemented
6. MongoDB records

Example:

```text
screenshots/
├── create-event.png
├── event-list.png
└── database-records.png
```

## Security Notes

- Do not upload `.env` files containing passwords or secret keys.
- Do not commit `node_modules/` or generated build folders.
- Validate user input on the backend as well as the frontend.
- Protect administrative API routes when authentication is implemented.
- Use hashed passwords rather than storing plain-text passwords.

## Future Enhancements

- Advanced event search and filtering
- Event editing and deletion
- Registration confirmation and capacity management
- Role-based access control
- Dashboard analytics and downloadable reports
- Email notifications
- Improved mobile responsiveness
- Automated tests

## Conclusion

The College Event Management System demonstrates how React, Node.js, Express.js, and MongoDB can be used to build a web application for managing college events. It provides a foundation for publishing event information and can be extended with registration, administration, search, and reporting features.

## Author

**Student Name:** Your Name  
**Course / Semester:** Your Course  
**Department:** Your Department  
**College:** Your College  

## License

This project was developed for educational and academic assignment purposes.