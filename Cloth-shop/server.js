const app = require('./app');
const mongoose = require('mongoose');
const config = require('./config/env');
// أضف هذا في بداية ملف server.js
//const mongoose = require('mongoose');
//mongoose.set('useFindAndModify', false);


/*      npm run dev      */



// 1. Database Connection
// ----------------------
const connectDB = async () => {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ DB connection successful!');

    // Monitoring connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from DB');
    });

  } catch (err) {
    console.error('❌ DB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

// 2. Start Server
// --------------
const startServer = () => {
  const server = app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port} in ${config.env} mode`);
    console.log(`🔗 API: http://localhost:${config.port}/api/v1`);
  });

  return server;
};

// 3. Error Handling
// -----------------
const handleUnhandledErrors = (server) => {
  // Unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('⛔ UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('⛔ UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
  });

  // SIGTERM (For Heroku, Docker, etc.)
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
      console.log('💤 Process terminated');
    });
  });
};

// 4. Initialize Application
// -------------------------
(async () => {
  try {
    await connectDB();
    const server = startServer();
    handleUnhandledErrors(server);
  } catch (err) {
    console.error('🔥 Failed to start application:', err);
    process.exit(1);
  }
})();