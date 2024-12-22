const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Activity = require('../models/activity.model');
const Marathon = require('../models/marathon.model');

router.get('/', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const activityCount = await Activity.countDocuments();
        const marathonCount = await Marathon.countDocuments();

        const recentUsers = await User.find({}, '_id name createdDate ').sort({ createdDate: -1 }).limit(50);

        const activities = await Activity.find().sort({ createdDate: -1 }).limit(50);
        const activitiesUserIds = activities.map(activity => activity.userId).filter(id => id && id.toString().match(/^[0-9a-fA-F]{24}$/));
        const activitiesUsers = await User.find({ _id: { $in: activitiesUserIds } });
        const recentActivities = activities.map(activity => {
            const user = activitiesUsers.find(user => user._id.toString() === activity.userId.toString());
            return {
                ...activity.toObject(),
                user: user
            };
        });


        const marathons = await Marathon.find().sort({ createdDate: -1 }).limit(50);
        const marathonsUserIds = marathons.map(marathon => marathon.userId).filter(id => id && id.toString().match(/^[0-9a-fA-F]{24}$/));
        const marathonsUsers = await User.find({ _id: { $in: marathonsUserIds } });
        const recentMarathons = activities.map(marathon => {
            const user = marathonsUsers.find(user => user._id.toString() === marathon.userId.toString());
            return {
                ...marathon.toObject(),
                user: user
            };
        });

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${process.env.NODE_ENV} Environment</title>
          <style>
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f4f4f4;
            }
          </style>
        </head>
        <body>
          <h1>Current Environment: ${process.env.NODE_ENV}</h1>
          <p>PORT: ${process.env.PORT}</p>
          <p>FRONTEND_URL: ${process.env.FRONTEND_URL}</p>
          <p>MONGODB_URL: ${process.env.MONGO_URL}</p>
  
          <h2>Total Counts:</h2>
          <p>Users: ${userCount}</p>
          <p>Activities: ${activityCount}</p>
          <p>Marathons: ${marathonCount}</p>
  
          <h2>Recent Users (50):</h2>
          <table>
            <tr>
              <th>#</th>
              <th>User ID</th>
              <th>Name</th>
              <th>Detail URL</th>
              <th>Created At</th>
            </tr>
            ${recentUsers.map((user, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${user._id}</td>
                <td>${user.name}</td>
                <td>${process.env.FRONTEND_URL}/partner/detail?id=${user._id}</td>
                <td>${new Date(user.createdDate).toLocaleString()}</td>
              </tr>`).join('')}
          </table>
  
          <h2>Recent Activities (50):</h2>
          <table>
            <tr>
              <th>#</th>
              <th>Activity ID</th>
              <th>Title</th>
              <th>User Name</th>
              <th>Detail URL</th>
              <th>Created At</th>
            </tr>
            ${recentActivities.map((activity, index) => {
                const activityObj = activity.toObject ? activity.toObject() : activity;
                return `
                    <tr>
                    <td>${index + 1}</td>
                    <td>${activityObj._id}</td>
                    <td>${activityObj.title}</td>
                    <td>${activityObj.user?.name || 'N/A'}</td>
                    <td>${process.env.FRONTEND_URL}/group/detail?id=${activityObj._id}</td>
                    <td>${new Date(activityObj.createdDate).toLocaleString()}</td>
                    </tr>`;
            }).join('')}
          </table>
  
          <h2>Recent Marathons (50):</h2>
          <table>
            <tr>
              <th>#</th>
              <th>Marathon ID</th>
              <th>User Name</th>
              <th>Created At</th>
            </tr>
            ${recentMarathons.map((marathon, index) => {
                const marathonObj = marathon.toObject? marathon.toObject() : marathon;
                return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${marathonObj._id}</td>
                    <td>${marathonObj.user?.name || 'N/A'}</td>
                    <td>${new Date(marathonObj.createdDate).toLocaleString()}</td>
                </tr>`;
            }).join('')}
          </table>
        </body>
        </html>
      `;

        res.send(htmlContent);
    } catch (error) {
        console.error('Error fetching recent data:', error);
        res.status(500).send('An error occurred while fetching recent data.');
    }
});

module.exports = router;
