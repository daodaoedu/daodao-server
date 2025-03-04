const { Op } = require('sequelize');
const sequelize = require('../config/db');
const {
    Marathon,
    MentorMarathon,
    MentorParticipants,
    ProjectMarathon,
    Project,
    Review,
    Post,
    User,
    Role,
    Location,
    Contact,
    BasicInfo,
    Position
} = require('../models');

/* 1. 指定、調整與刪除 mentor 參與哪個 marathon */

// 指定 mentor 參與 marathon（使用 req.body.marathonId，這裡假設傳入 marathon 的 external_id）
exports.assignMentorToMarathon = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { mentorId,eventId } = req.body;
        console.log('eventId',eventId);
        // 以 external_id 找出 marathon
        const marathon = await Marathon.findOne({ where: { event_id: eventId } });
        if (!marathon) {
            throw new Error('找不到該 marathon');
        }
        // 檢查是否已經指定
        const existing = await MentorMarathon.findOne({
            where: { mentor_id: mentorId, marathon_id: marathon.id }
        });
        if (existing) {
            return res.status(400).json({ error: true, message: '已指定該 marathon' });
        }
        // 新增 mentor 與 marathon 關聯
        const assignment = await MentorMarathon.create({
            mentor_id: mentorId,
            marathon_id: marathon.id
        }, { transaction });

        await transaction.commit();
        return res.status(201).json({ message: '成功指定 mentor 參與 marathon', data: assignment });
    } catch (err) {
        await transaction.rollback();
        return res.status(400).json({ error: true, message: '指定失敗', details: err.message });
    }
};

// 調整（更新） mentor 與 marathon 的關聯
exports.updateMentorMarathon = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        // 例如利用 URL 參數指定關聯記錄的 id
        const { assignmentId } = req.params;
        const { marathonId } = req.body;
        const assignment = await MentorMarathon.findByPk(assignmentId, { transaction });
        if (!assignment) {
            throw new Error('關聯記錄不存在');
        }
        if (marathonId) {
            const marathon = await Marathon.findOne({ where: { external_id: marathonId } });
            if (!marathon) {
                throw new Error('找不到該 marathon');
            }
            assignment.marathon_id = marathon.id;
        }
        await assignment.save({ transaction });
        await transaction.commit();
        return res.json({ message: '關聯記錄更新成功', data: assignment });
    } catch (err) {
        await transaction.rollback();
        return res.status(400).json({ error: true, message: '更新失敗', details: err.message });
    }
};

// 刪除 mentor 與 marathon 的關聯
exports.deleteMentorFromMarathon = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { assignmentId } = req.params;
        const assignment = await MentorMarathon.findByPk(assignmentId, { transaction });
        if (!assignment) {
            throw new Error('關聯記錄不存在');
        }
        await assignment.destroy({ transaction });
        await transaction.commit();
        return res.json({ message: '成功刪除該 marathon 參與記錄' });
    } catch (err) {
        await transaction.rollback();
        return res.status(400).json({ error: true, message: '刪除失敗', details: err.message });
    }
};


/* 2. 取得 mentor 參與的 marathon，包含 participant 人數、marathon 的 start_date 與 end_date */

exports.getMentorMarathons = async (req, res) => {
    try {
        // 取得該 mentor 的所有 marathon 關聯記錄
        const assignments = await MentorMarathon.findAll({
            where: { mentor_id: req.user.id },
            include: [{
                model: Marathon,
            }]
        });
        // 對每筆記錄計算該 marathon 下，mentor 底下 participant 的數量
        const results = await Promise.all(assignments.map(async (assignment) => {
            // 檢查 assignment.Marathon 是否存在
            if (!assignment.Marathon) {
                return {
                    marathon: null,
                    participantCount: 0
                };
            }
            // 取得該 mentor 指定的所有 participant id
            const mentorParticipants = await MentorParticipants.findAll({
                where: { mentor_id: req.user.id },
            });
            const participantIds = mentorParticipants.map(mp => mp.participant_id);
            // 統計這些 participant 所屬的 project，在此 marathon 中的報名數量
            const count = await ProjectMarathon.count({
                where: { marathon_id: assignment.Marathon.id },
                include: [{
                    model: Project,
                    where: { user_id: { [Op.in]: participantIds }, version: 2 },
                    attributes: []
                }]
            });
            return {
                marathon: assignment.Marathon,
                participantCount: count
            };
        }));

        const formatResponse = (results) => {

            return {
              id: results.marathon.id,
              eventId: results.marathon.event_id,
              title: results.marathon.title,
              startDate: results.marathon.start_date,
              endDate: results.marathon.end_date,
              participantCount: results.participantCount
            };
          };

        

        return res.json(results.map(result => formatResponse(result)));
    } catch (err) {
        return res.status(500).json({ error: true, message: '取得資料失敗', details: err.message });
    }
};


/* 3. 指定、調整與刪除 mentor 輔導哪些 participant */

// 指定 mentor 輔導某 participant
exports.assignParticipantToMentor = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { participantId } = req.body;
        // 檢查是否已指定
        const existing = await MentorParticipants.findOne({
            where: { mentor_id: req.user.id, participant_id: participantId }
        });
        if (existing) {
            return res.status(400).json({ error: true, message: '該 participant 已指派給 mentor' });
        }
        const record = await MentorParticipants.create({
            mentor_id: req.user.id,
            participant_id: participantId
        }, { transaction });
        await transaction.commit();
        return res.status(201).json({ message: '成功指派 participant', data: record });
    } catch (err) {
        await transaction.rollback();
        return res.status(400).json({ error: true, message: '指派失敗', details: err.message });
    }
};

// 由於 mentor_participants 表僅為複合主鍵，若無其他欄位則更新功能通常不需要
exports.updateMentorParticipant = async (req, res) => {
    return res.status(501).json({ error: true, message: '更新功能尚未實作' });
};

// 刪除 mentor 與 participant 之間的關聯
exports.removeMentorParticipant = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { participantId } = req.params;
        const record = await MentorParticipants.findOne({
            where: { mentor_id: req.user.id, participant_id: participantId },
            transaction
        });
        if (!record) {
            throw new Error('該指派記錄不存在');
        }
        await record.destroy({ transaction });
        await transaction.commit();
        return res.json({ message: '成功移除該 participant' });
    } catch (err) {
        await transaction.rollback();
        return res.status(400).json({ error: true, message: '移除失敗', details: err.message });
    }
};


/* 4. 取得 mentor 在某個 marathon（依 eventId）的 participant 列表 */

exports.getMentorParticipantsByMarathon = async (req, res) => {
    try {
        const { eventId } = req.params;
        // 以 eventId 找出 marathon
        const marathon = await Marathon.findOne({ where: { event_id: eventId } });
        if (!marathon) {
            return res.status(404).json({ error: true, message: '找不到該 marathon' });
        }

        // 取得該 mentor 底下所有 participant id
        const mentorParticipants = await MentorParticipants.findAll({
            where: { mentor_id: req.user.id },
            attributes: ['participant_id']
        });
        const participantIds = mentorParticipants.map(mp => mp.participant_id);

        // 從 project_marathon 找出這些 participant（透過其所擁有的 project）有報名此 marathon 的記錄
        // 並且只抓取 project 的 user_id 與 external_id（版本需為 2）
        const registrations = await ProjectMarathon.findAll({
            where: { marathon_id: marathon.id },
            include: [{
                model: Project,
                where: { 
                    user_id: { [Op.in]: participantIds },
                    version: 2 
                },
                attributes: ['user_id', 'external_id','title']
            }]
        });
        console.log('registrations', registrations);

        // 從報名記錄中整理出參賽者 id 與對應的 project external_id 和 title
        const participantMap = {};
        registrations.forEach(reg => {
            const userId = reg.Project.user_id;
            console.log('reg.Project', reg.Project);
            // 若同一個 user 有多筆 registration，這裡只取第一筆的 external_id 和 title（根據需求可進行調整）
            if (!participantMap[userId]) {
                participantMap[userId] = {
                    externalId: reg.Project.external_id,
                    title: reg.Project.title
                };
            }
        });
        const participantIdsFromRegistration = Object.keys(participantMap);
        console.log('participantIdsFromRegistration', participantIdsFromRegistration);

        // 取得這些參賽者詳細使用者資訊
        const users = await User.findAll({
            where: { id: { [Op.in]: participantIdsFromRegistration } },
            include: [
                { model: Role },
                { model: Location },
                { model: Contact },
                { model: BasicInfo },
                {
                    model: Position,
                    through: { attributes: [] },
                },
            ],
        });

        // 將 project external_id 與使用者資料結合
        const participants = users.map(user => ({
            ...user.toJSON(),
            projectId: participantMap[user.id].externalId,
            projectTitle: participantMap[user.id].title
        }));

        const formatResponse = (marathon, participants) => {
            return {
              id: marathon.id,
              eventId: marathon.event_id,
              title: marathon.title,
              startDate: marathon.start_date,
              endDate: marathon.end_date,
              participants: participants.map(
                (participant) => ({
                    id: participant.id,
                    name: participant.nickname,
                    _id: participant.external_id,
                    roleList: participant.Positions ? participant.Positions.map(p => p.name) : [],
                    photoURL: participant.Contact ? participant.Contact.photo_url : null,
                    location: participant.Location?.City?.name || '',
                    tagList: participant.tag_list,
                    wantToDoList: participant.BasicInfo?.want_to_do_list,
                    educationStage: participant.education_stage,
                    share: participant.BasicInfo?.share_list,
                    updatedDate: participant.updated_at,
                    projectId: participant.projectId,
                    projectTitle: participant.projectTitle,
                }))
            };
          };
          console.log('formatResponse',formatResponse)

        return res.json(formatResponse(marathon, participants));
    } catch (err) {
        return res.status(500).json({ error: true, message: '取得 participant 失敗', details: err.message });
    }
};



/* 5. 取得 mentor 底下所有 participant 在某個 marathon 的 project 中的 review 資料 */

exports.getReviewsForMentorParticipants = async (req, res) => {
    try {
        const { eventId } = req.params;
        console.log('eventId',eventId);
        // 找出 marathon
        const marathon = await Marathon.findOne({ where: { event_id: eventId } });
        if (!marathon) {
            return res.status(404).json({ error: true, message: '找不到該 marathon' });
        }
        // 取得該 mentor 底下所有 participant id
        const mentorParticipants = await MentorParticipants.findAll({
            where: { mentor_id: req.user.id },
            attributes: ['participant_id']
        });
        const participantIds = mentorParticipants.map(mp => mp.participant_id);
        // 取得這些 participant 所擁有，且有報名該 marathon 的 project 記錄
        const projectRegistrations = await ProjectMarathon.findAll({
            where: { marathon_id: marathon.id },
            include: [{
                model: Project,
                where: { user_id: { [Op.in]: participantIds } },
                attributes: ['id', 'title', 'user_id']
            }]
        });
        const projectIds = projectRegistrations.map(pr => pr.Project.id);
        // 從 Review 取得這些 project 的 review，Review 與 Post 透過 post_id 連結，而 Post 中有 project_id
        const reviews = await Review.findAll({
            include: [{
                model: Post,
                where: { project_id: { [Op.in]: projectIds } },
                attributes: ['id', 'project_id', 'title']
            }]
        });
        return res.json({ marathon, reviews });
    } catch (err) {
        return res.status(500).json({ error: true, message: '取得 review 資料失敗', details: err.message });
    }
};
