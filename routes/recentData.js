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

    const recentUsers = await User.find({}, '_id name email createdDate updatedDate  ').sort({ createdDate: -1 }).limit(50);

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
    const recentMarathons = marathons.map(marathon => {
      const user = marathon.userId ?
        marathonsUsers.find(user => user._id.toString() === marathon.userId.toString())
        : null;

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
            .marathons {
              display: flex;
              flex-direction: column;
              gap: 20px; /* 每個馬拉松資料的間距 */
            }

            .marathon-item {
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 8px;
              background-color: #f9f9f9;
            }

            .marathon-item h3 {
              margin-top: 0;
            }

            .marathon-item div {
              margin-bottom: 10px;
            }

            .marathon-item strong {
              color: #333;
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
              <th>User Email</th>
              <th>Name</th>
              <th>Detail URL</th>
              <th>Created At</th>
              <th>Updated At</th>
            </tr>
            ${recentUsers.map((user, index) => {
              const url = `${process.env.FRONTEND_URL}/partner/detail?id=${user._id || ''}`;
              return `
                          <tr>
                            <td>${index + 1}</td>
                            <td>${user.email}</td>
                            <td>${user.name}</td>
                            <td><a href="${url}" target="_blank">${url}</a></td>
                            <td>${new Date(user.createdDate).toLocaleString()}</td>
                            <td>${new Date(user.updatedDate).toLocaleString()}</td>
                          </tr>`;
            }).join('')}
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
              <th>Updated At</th>
            </tr>
            ${recentActivities.map((activity, index) => {
              const activityObj = activity.toObject ? activity.toObject() : activity;
              const url = `${process.env.FRONTEND_URL}/group/detail?id=${activityObj._id || ''}`;
              return `
                            <tr>
                            <td>${index + 1}</td>
                            <td>${activityObj._id}</td>
                            <td>${activityObj.title}</td>
                            <td>${activityObj.user?.name || 'N/A'}</td>
                            <td><a href="${url}" target="_blank">${url}</a></td>
                            <td>${new Date(activityObj.createdDate).toLocaleString()}</td>
                            <td>${new Date(activityObj.updatedDate).toLocaleString()}</td>
                            </tr>`;
            }).join('')}
          </table>
          <h2>Recent Marathons (50):</h2>
          <div class="marathon-container" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="text-align: center; margin-bottom: 20px;">Marathon Details</h2>
            ${recentMarathons.map((marathon, index) => {
              const marathonObj = marathon.toObject ? marathon.toObject() : marathon;
              return `
                <div class="marathon-item" style="border: 1px solid #ccc; border-radius: 8px; margin-bottom: 20px; padding: 20px; background-color: #f9f9f9;">
                  <h3 style="color: #0056b3;">Marathon #${index + 1}</h3>
                  <hr style="margin: 10px 0; border-top: 1px solid #ddd;">
                  <div style="margin-bottom: 10px;"><strong>Marathon ID:</strong> ${marathonObj._id}</div>
                  <div style="margin-bottom: 10px;"><strong>User Email:</strong> ${marathonObj.user?.email || 'N/A'}</div>
                  <div style="margin-bottom: 10px;"><strong>User Name:</strong> ${marathonObj.user?.name || 'N/A'}</div>
                  <div style="margin-bottom: 10px;"><strong>Title:</strong> ${marathonObj.title || 'N/A'}</div>
                  <div style="margin-bottom: 10px;"><strong>Description:</strong>
                    <div style="padding: 10px; background-color: #fff; border: 1px solid #ddd; border-radius: 4px; max-height: 100px; overflow-y: auto; word-break: break-word;">
                      ${marathonObj.description || 'N/A'}
                    </div>
                  </div>
                  <div style="margin-bottom: 10px;"><strong>Goals:</strong> ${marathonObj.goals || 'N/A'}</div>
                  <div style="margin-bottom: 10px;"><strong>Content:</strong>
                    <div style="padding: 10px; background-color: #fff; border: 1px solid #ddd; border-radius: 4px; max-height: 100px; overflow-y: auto; word-break: break-word;">
                      ${marathonObj.content || 'N/A'}
                    </div>
                  </div>
                  <h4 style="color: #0056b3;">Motivation</h4>
                  <div style="margin-bottom: 10px;"><strong>Tags:</strong> ${marathonObj.motivation?.tags?.join(', ') || 'N/A'}</div>
                  <div style="margin-bottom: 10px;"><strong>Description:</strong> ${marathonObj.motivation?.description || 'N/A'}</div>
                  <h4 style="color: #0056b3;">Strategies</h4>
                  <div style="margin-bottom: 10px;"><strong>Tags:</strong> ${marathonObj.strategies?.tags?.join(', ') || 'N/A'}</div>
                  <div style="margin-bottom: 10px;"><strong>Description:</strong> ${marathonObj.strategies?.description || 'N/A'}</div>
                  <h4 style="color: #0056b3;">Resources</h4>
                  <div style="margin-bottom: 10px;"><strong>Title:</strong> ${marathonObj.resources?.title || 'N/A'}</div>
                  <div style="margin-bottom: 10px;"><strong>Link:</strong>
                    <a href="${marathonObj.resources?.link || '#'}" target="_blank" style="color: #007bff; text-decoration: none;">
                      ${marathonObj.resources?.link || 'N/A'}
                    </a>
                  </div>
                  <h4 style="color: #0056b3;">Milestones</h4>
                  <div style="margin-bottom: 10px;">
                    ${marathonObj.milestones?.length > 0 ? marathonObj.milestones.map((milestone, idx) => `
                      <div style="margin-bottom: 5px;">
                        <strong>Milestone ${idx + 1}:</strong> 
                        <div><strong>Title:</strong> ${milestone.name || 'N/A'}</div>
                        <div><strong>Start Date:</strong> ${milestone.startDate ? new Date(milestone.startDate).toLocaleDateString() : 'N/A'}</div>
                        <div><strong>End Date:</strong> ${milestone.endDate ? new Date(milestone.endDate).toLocaleDateString() : 'N/A'}</div>
                        <div><strong>Description:</strong> ${milestone.description || 'N/A'}</div>
                        <div><strong>Sub-Milestones:</strong>
                          ${milestone.subMilestones?.length > 0 ? milestone.subMilestones.map(sub => `
                            <div style="padding-left: 10px;">
                              <div><strong>Name:</strong> ${sub.name || 'N/A'}</div>
                              <div><strong>Dates:</strong> ${sub.dates?.map(date => new Date(date).toLocaleDateString()).join(', ') || 'N/A'}</div>
                              <div><strong>Description:</strong> ${sub.description || 'N/A'}</div>
                            </div>
                          `).join('') : 'None'}
                        </div>
                      </div>
                    `).join('') : 'N/A'}
                  </div>
                  <h4 style="color: #0056b3;">Outcomes</h4>
                  <div style="margin-bottom: 10px;"><strong>Tags:</strong> ${marathonObj.outcomes?.tags?.join(', ') || 'N/A'}</div>
                  <div style="margin-bottom: 10px;"><strong>Description:</strong> ${marathonObj.outcomes?.description || 'N/A'}</div>
                  <div style="margin-bottom: 10px;"><strong>Status:</strong> ${marathonObj.status || 'N/A'}</div>
                  <div style="margin-bottom: 10px;"><strong>Registration Status:</strong> ${marathonObj.registrationStatus || 'N/A'}</div>
                  <div style="margin-bottom: 10px;"><strong>Registration Date:</strong> ${marathonObj.registrationDate || 'N/A'}</div>
                  <h4 style="color: #0056b3;">Pricing</h4>
                  <div style="margin-bottom: 10px;">
                    <strong>Option:</strong> ${marathonObj.pricing?.option || 'N/A'}<br>
                    <strong>Price:</strong> ${marathonObj.pricing?.price || 'N/A'}<br>
                    <strong>Email:</strong> ${marathonObj.pricing?.email?.join(', ') || 'N/A'}
                  </div>
                  <div style="margin-bottom: 10px;"><strong>Public:</strong> ${marathonObj.isPublic ? 'Yes' : 'No'}</div>
                  <div style="margin-bottom: 10px;"><strong>Send Email:</strong> ${marathonObj.isSendEmail ? 'Yes' : 'No'}</div>
                  <div style="margin-bottom: 10px;"><strong>Created At:</strong> ${new Date(marathonObj.createdDate).toLocaleString()}</div>
                  <div style="margin-bottom: 10px;"><strong>Updated At:</strong> ${new Date(marathonObj.updatedDate).toLocaleString()}</div>
                </div>
              `;
            }).join('')}
          </div>
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
