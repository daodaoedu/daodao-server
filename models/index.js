const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');

// 導入所有模型
const User = require('./user');
const Role = require('./role');
const Permission = require('./permission');
const Position = require('./position');
const Location = require('./location');
const City = require('./city');
const Country = require('./country');
const Contact = require('./contact');
const BasicInfo = require('./basicInfo');
const UserProject = require('./userProject');

const Project = require('./project');
const Post = require('./post');
const Milestone = require('./milestone');
const Task = require('./task');
const Review = require('./review');
const Note = require('./note');
const Outcome = require('./outcome');

const ProjectMarathon = require('./projectMarathon');
const Eligibility = require('./eligibility');
const Marathon = require('./marathon');
const FeePlan = require('./feePlan');
const Circle = require('./circle');
const Comment = require('./comment');
const MentorParticipants = require('./mentorParticipants');
const MentorMarathon = require('./mentorMarathon');
const Idea = require('./idea');
const IdeaResource = require('./ideaResource');

// 新增 Resource 相關模型 (條件載入 TypeScript 模型)
let Resource, ResourceReview, Category, Tag, EntityTag;

try {
  // 嘗試載入 TypeScript 模型
  require('ts-node/register');
  require('tsconfig-paths/register');
  Resource = require('../src/models/resource').default;
  ResourceReview = require('../src/models/resourceReview').default;
  Category = require('../src/models/category').default;
  Tag = require('../src/models/tag').default;
  EntityTag = require('../src/models/entityTag').default;
  console.log('✅ Successfully loaded TypeScript Resource models');
} catch (error) {
  console.log('⚠️  TypeScript Resource models not available:', error.message);
  console.log('💡 Resource-related associations will be skipped');
}

const setupAssociations = () => {
  // 1. 用戶身份相關關聯
  User.belongsTo(Role, {
    foreignKey: 'role_id',
  });

  Role.hasMany(User, {
    foreignKey: 'role_id',
  });

  User.belongsToMany(Permission, {
    through: 'user_permissions',
    foreignKey: 'user_id',
    otherKey: 'permission_id',
  });
  Permission.belongsToMany(User, {
    through: 'user_permissions',
    foreignKey: 'permission_id',
    otherKey: 'user_id',
  });

  User.belongsToMany(Position, {
    through: 'user_positions',
    foreignKey: 'user_id',
    otherKey: 'position_id',
  });
  Position.belongsToMany(User, {
    through: 'user_positions',
    foreignKey: 'position_id',
    otherKey: 'user_id',
  });

  // 2. 用戶資料相關關聯
  User.belongsTo(Location, {
    foreignKey: 'location_id',
  });
  Location.hasMany(User, {
    foreignKey: 'location_id',
  });

  User.belongsTo(Contact, {
    foreignKey: 'contact_id',
  });
  Contact.hasOne(User, {
    foreignKey: 'contact_id',
  });

  User.belongsTo(BasicInfo, {
    foreignKey: 'basic_info_id',
  });
  BasicInfo.hasOne(User, {
    foreignKey: 'basic_info_id',
  });
  Location.belongsTo(City, {
    foreignKey: 'city_id',
  });
  City.hasMany(Location, {
    foreignKey: 'city_id',
  });
  Location.belongsTo(Country, {
    foreignKey: 'country_id',
  });
  Country.hasMany(Location, {
    foreignKey: 'country_id',
  });

  // 3. 專案相關關聯
  User.hasMany(Project, {
    foreignKey: 'user_id',
  });

  User.belongsToMany(Project, {
    through: "user_projects",
    foreignKey: 'user_id',
    otherKey: 'project_id',
  });

  Project.belongsTo(User, {
    foreignKey: 'user_id'
  });

  UserProject.belongsTo(User, {
    foreignKey: 'user_external_id',
    targetKey: 'external_id',
  });

  UserProject.belongsTo(Project, {
    foreignKey: 'project_id',
    targetKey: 'id',
  });

  Project.hasMany(Milestone, {
    foreignKey: 'project_id',
    onDelete: 'CASCADE'
  });
  Milestone.belongsTo(Project, {
    foreignKey: 'project_id',
  });

  Post.hasMany(Review, {
    foreignKey: 'post_id',
    onDelete: 'CASCADE'
  });
  Review.belongsTo(Post, {
    foreignKey: 'post_id',
  });

  Post.hasMany(Note, {
    foreignKey: 'post_id',
    onDelete: 'CASCADE'
  });
  Note.belongsTo(Post, {
    foreignKey: 'post_id',
  });

  Post.hasMany(Outcome, {
    foreignKey: 'post_id',
    onDelete: 'CASCADE'
  });
  Outcome.belongsTo(Post, {
    foreignKey: 'post_id',
  });

  // 新增專案與文章的關聯
  Project.hasMany(Post, {
    foreignKey: 'project_id',
    onDelete: 'CASCADE'
  });
  Post.belongsTo(Project, {
    foreignKey: 'project_id',
  });

  // 4. 里程碑和任務關聯
  Milestone.hasMany(Task, {
    foreignKey: 'milestone_id',
    onDelete: 'CASCADE'
  });
  Task.belongsTo(Milestone, {
    foreignKey: 'milestone_id',
  });

  // 5. 專案馬拉松關聯
  ProjectMarathon.belongsTo(Project, {
    foreignKey: 'project_id',
  });

  Project.hasMany(ProjectMarathon, {
    foreignKey: 'project_id',
  });

  ProjectMarathon.belongsTo(Marathon, {
    foreignKey: 'marathon_id',
  });

  ProjectMarathon.belongsTo(Eligibility, {
    foreignKey: 'eligibility_id',
  });

  // 马拉松关联
  Marathon.belongsTo(User, {
    foreignKey: 'created_by',
  });

  // 资格关联
  Eligibility.belongsTo(FeePlan, {
    foreignKey: 'fee_plans_id',
  });

  // 反向关联
  Project.hasMany(ProjectMarathon, {
    foreignKey: 'project_id',
  });

  Marathon.hasMany(ProjectMarathon, {
    foreignKey: 'marathon_id',
  });

  FeePlan.hasMany(Eligibility, {
    foreignKey: 'fee_plans_id',
  });

  User.hasMany(Circle, { foreignKey: 'created_by' });

  Circle.belongsTo(User, { foreignKey: 'created_by' });


  User.hasMany(Comment, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  Comment.belongsTo(User, { foreignKey: 'user_id' });

  // 7. 導師與參與者關聯（MentorParticipants）
  // 建立 User 與 User 之間的多對多關聯，分別以 'Participants' 與 'Mentors' 為別名
  User.belongsToMany(User, {
    as: 'Participants',
    through: MentorParticipants,
    foreignKey: 'mentor_id',
    otherKey: 'participant_id'
  });
  User.belongsToMany(User, {
    as: 'Mentors',
    through: MentorParticipants,
    foreignKey: 'participant_id',
    otherKey: 'mentor_id'
  });

  // 8. 導師與馬拉松關聯（新加入 MentorMarathon）
  User.hasMany(MentorMarathon, { foreignKey: 'mentor_id' });
  MentorMarathon.belongsTo(User, { foreignKey: 'mentor_id' });

  Marathon.hasMany(MentorMarathon, { foreignKey: 'marathon_id' });
  MentorMarathon.belongsTo(Marathon, { foreignKey: 'marathon_id' });

  // 一個 Idea 可能會有多筆學習資源
  Idea.hasMany(IdeaResource, {
    foreignKey: 'idea_id',
    onDelete: 'CASCADE'
  });
  
  Idea.belongsTo(User, { foreignKey: 'user_id' });

  // 學習資源屬於某個 Idea
  IdeaResource.belongsTo(Idea, {
    foreignKey: 'idea_id',
    as : 'IdeaResources'
  });

  // 9. Resource 相關關聯 (僅在模型存在時設定)
  if (Resource) {
    // Resource 與 User 的關聯
    User.hasMany(Resource, {
      foreignKey: 'created_by',
      as: 'createdResources'
    });
    Resource.belongsTo(User, {
      foreignKey: 'created_by',
      as: 'author'
    });
  }

  // Resource 與 Category 的關聯
  if (Resource && Category) {
    Resource.belongsTo(Category, {
      foreignKey: 'major_category_id',
      as: 'majorCategory'
    });
    Resource.belongsTo(Category, {
      foreignKey: 'sub_category_id',
      as: 'subCategory'
    });
    Category.hasMany(Resource, {
      foreignKey: 'major_category_id',
      as: 'resourcesAsMajor'
    });
    Category.hasMany(Resource, {
      foreignKey: 'sub_category_id',
      as: 'resourcesAsSub'
    });
  }

  // 10. ResourceReview 相關關聯
  if (ResourceReview) {
    // ResourceReview 與 User 的關聯
    User.hasMany(ResourceReview, {
      foreignKey: 'user_id',
      as: 'reviews'
    });
    ResourceReview.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'author'
    });

    // ResourceReview 與 Resource 的關聯
    if (Resource) {
      Resource.hasMany(ResourceReview, {
        foreignKey: 'resource_id',
        as: 'reviews'
      });
      ResourceReview.belongsTo(Resource, {
        foreignKey: 'resource_id',
        as: 'resource'
      });
    }
  }

  // 11. Category 自關聯（父子分類）
  if (Category) {
    Category.belongsTo(Category, {
      foreignKey: 'parent_id',
      as: 'parent'
    });
    Category.hasMany(Category, {
      foreignKey: 'parent_id',
      as: 'children'
    });
  }

  // 12. Tag 與 EntityTag 關聯
  if (Tag && EntityTag) {
    Tag.hasMany(EntityTag, {
      foreignKey: 'tag_id',
      as: 'entityTags'
    });
    EntityTag.belongsTo(Tag, {
      foreignKey: 'tag_id',
      as: 'tag'
    });
  }

  // 13. Resource 與 Tag 的多對多關聯（透過 EntityTag）
  if (Resource && Tag && EntityTag) {
    Resource.belongsToMany(Tag, {
      through: {
        model: EntityTag,
        unique: false,
        scope: {
          entity_type: 'resource'
        }
      },
      foreignKey: 'entity_id',
      otherKey: 'tag_id',
      as: 'tags',
      constraints: false
    });
    Tag.belongsToMany(Resource, {
      through: {
        model: EntityTag,
        unique: false,
        scope: {
          entity_type: 'resource'
        }
      },
      foreignKey: 'tag_id',
      otherKey: 'entity_id',
      as: 'resources',
      constraints: false
    });
  }

  // 14. ResourceReview 與 Tag 的多對多關聯（透過 EntityTag）
  if (ResourceReview && Tag && EntityTag) {
    ResourceReview.belongsToMany(Tag, {
      through: {
        model: EntityTag,
        unique: false,
        scope: {
          entity_type: 'resource_review'
        }
      },
      foreignKey: 'entity_id',
      otherKey: 'tag_id',
      as: 'tags',
      constraints: false
    });
    Tag.belongsToMany(ResourceReview, {
      through: {
        model: EntityTag,
        unique: false,
        scope: {
          entity_type: 'resource_review'
        }
      },
      foreignKey: 'tag_id',
      otherKey: 'entity_id',
      as: 'resourceReviews',
      constraints: false
    });
  }

};

// 執行關聯設置
setupAssociations();

// 導出所有模型和 sequelize 實例
module.exports = {
  sequelize,
  Sequelize,
  User,
  UserProject,
  Role,
  Permission,
  Position,
  Location,
  City,
  Country,
  Contact,
  BasicInfo,
  Project,
  Post,
  Milestone,
  Task,
  Review,
  Note,
  Outcome,
  ProjectMarathon,
  Eligibility,
  Marathon,
  FeePlan,
  Circle,
  Comment,
  MentorParticipants,
  MentorMarathon,
  Idea,
  IdeaResource,
  // Resource 相關模型 (條件導出)
  ...(Resource ? { Resource } : {}),
  ...(ResourceReview ? { ResourceReview } : {}),
  ...(Category ? { Category } : {}),
  ...(Tag ? { Tag } : {}),
  ...(EntityTag ? { EntityTag } : {})
};
