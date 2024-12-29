# Prayer Time Locker

A Node.js application that automatically locks your computer screen during Islamic prayer times. It provides a web interface to set and manage prayer time schedules with real-time status monitoring.

## Features

- 🕌 Set custom prayer time schedules
- 🔒 Automatic screen locking during prayer times
- 📊 Real-time status monitoring
- 🌐 Multiple status endpoints (HTML, JSON, i3bar)
- 🔄 Auto-fetches prayer times from Aladhan API
- 💻 Cross-platform support (Windows, Linux, MacOS)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/siyamhosan/prayer-time-locker
cd prayer-time-locker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
CITY=YourCity
PORT=3133
```

4. For automatic startup (optional):
```bash
npm run setup
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open `http://localhost:3133` in your browser
3. Set your prayer times using the web interface
4. The system will automatically lock at scheduled prayer times

## API Endpoints

- `GET /prayer-lock-times` - Get currently scheduled prayer times
- `POST /set-lock-times` - Set new prayer time schedule
- `GET /status` - Get current lock status and next prayer time
- `GET /status/embed` - Get status in plain text format
- `GET /status/html` - Get status as styled HTML
- `GET /status/i3bar` - Get status formatted for i3bar
- `GET /prayer-times` - Fetch prayer times from Aladhan API

## Lock Duration

- Default lock duration: 1 minute
- Auto-unlock supported on Linux only
- Windows and MacOS require manual unlock

## Dependencies

- Express.js - Web framework
- Moment.js - Time handling
- Node Schedule - Task scheduling
- Axios - HTTP client
- Dotenv - Environment configuration

## License

ISC License

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.