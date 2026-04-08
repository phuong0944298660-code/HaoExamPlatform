#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
接力教育智慧云平台 - 演示数据导入脚本
根据 USER_GUIDE_AND_TEST_FLOW.md 业务流程创建完整模拟数据

使用方法:
    docker-compose -f docker-compose.simple.yml exec backend python scripts/import-demo-data.py
"""

import asyncio
import sys
import random
from datetime import datetime, timedelta
from typing import List, Optional

sys.path.insert(0, '/app')

from app.core.database import AsyncSessionLocal
from app.core.auth import hash_password
from app.models.account import Account, UserRole, GradeGroup, AccountType
from app.models.activation import ActivationPlan, ActivationCode, UserActivation
from app.models.question import QuestionBank, Question, QuestionType, DifficultyLevel
from app.models.exam import Exam, ExamStatus
from app.models.classes import Class, ClassStudent
# from app.models.scores import StudentScore  # 模型不存在，暂时注释
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

# 配置
DEMO_DATA_CONFIG = {
    "teachers": {
        "primary": [{"username": "teacher_pri_001", "name": "小学教师张三"},
                    {"username": "teacher_pri_002", "name": "小学教师李四"}],
        "junior": [{"username": "teacher_jun_001", "name": "初中教师王五"},
                   {"username": "teacher_jun_002", "name": "初中教师赵六"}]
    },
    "students": {
        "primary": 20,  # 小学学生数量
        "junior": 15    # 初中学生数量
    },
    "question_banks": {
        "primary": [
            {"name": "2024春季小学组模拟题1", "description": "小学组初赛模拟题库"},
            {"name": "2024春季小学组模拟题2", "description": "小学组复赛模拟题库"},
            {"name": "小学数学专项训练", "description": "数学知识点专项练习"},
            {"name": "小学英语专项训练", "description": "英语知识点专项练习"},
            {"name": "小学综合素质测评", "description": "综合素质评估题库"}
        ],
        "junior": [
            {"name": "2024春季初中组模拟题1", "description": "初中组初赛模拟题库"},
            {"name": "2024春季初中组模拟题2", "description": "初中组复赛模拟题库"},
            {"name": "初中数学提高训练", "description": "数学提高班练习"},
            {"name": "初中英语能力测评", "description": "英语能力评估"}
        ]
    },
    "classes": {
        "primary": [{"name": "小学一组", "grade": "五年级"}, {"name": "小学二组", "grade": "六年级"}],
        "junior": [{"name": "初中一组", "grade": "七年级"}, {"name": "初中二组", "grade": "八年级"}]
    }
}


class DemoDataImporter:
    """演示数据导入器"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.created_data = {
            "teachers": [],
            "students": [],
            "activation_plans": [],
            "activation_codes": [],
            "question_banks": [],
            "questions": [],
            "exams": [],
            "classes": [],
            "scores": []
        }
    
    async def import_all(self):
        """导入所有演示数据"""
        print("=" * 70)
        print("开始导入演示数据...")
        print("=" * 70)
        
        # 1. 创建激活计划
        await self.create_activation_plans()
        
        # 2. 创建教师账号
        await self.create_teachers()
        
        # 3. 创建学生账号
        await self.create_students()
        
        # 4. 生成激活码
        await self.generate_activation_codes()
        
        # 5. 激活部分账号
        await self.activate_accounts()
        
        # 6. 创建题库
        await self.create_question_banks()
        
        # 7. 录入试题
        await self.create_questions()
        
        # 8. 创建考试
        await self.create_exams()
        
        # 9. 创建班级
        await self.create_classes()
        
        # 10. 创建成绩数据
        await self.create_scores()
        
        print("\n" + "=" * 70)
        print("演示数据导入完成！")
        print("=" * 70)
        self.print_summary()
    
    async def create_activation_plans(self):
        """创建激活计划"""
        print("\n[1/10] 创建激活计划...")
        
        plans_data = [
            {
                "name": "小学教师年卡",
                "target_role": "teacher",
                "target_grade_group": "primary",
                "validity_days": 365,
                "price": 299.00,
                "is_online_sale": True,
                "permissions": {
                    "question_banks": [],
                    "resource_packages": ["pri_math", "pri_english"],
                    "features": {
                        "can_create_exam": True,
                        "can_use_ai_grader": True,
                        "can_export_data": True,
                        "can_batch_import": True
                    }
                }
            },
            {
                "name": "小学学生季卡",
                "target_role": "student",
                "target_grade_group": "primary",
                "validity_days": 90,
                "price": 99.00,
                "is_online_sale": True,
                "permissions": {
                    "question_banks": [1, 2, 3, 4, 5],
                    "resource_packages": [],
                    "features": {
                        "can_create_exam": False,
                        "can_use_ai_grader": False,
                        "can_export_data": False,
                        "can_batch_import": False
                    }
                }
            },
            {
                "name": "初中教师年卡",
                "target_role": "teacher",
                "target_grade_group": "junior",
                "validity_days": 365,
                "price": 399.00,
                "is_online_sale": True,
                "permissions": {
                    "question_banks": [],
                    "resource_packages": ["jun_math", "jun_english"],
                    "features": {
                        "can_create_exam": True,
                        "can_use_ai_grader": True,
                        "can_export_data": True,
                        "can_batch_import": True
                    }
                }
            },
            {
                "name": "初中学生半年卡",
                "target_role": "student",
                "target_grade_group": "junior",
                "validity_days": 180,
                "price": 199.00,
                "is_online_sale": True,
                "permissions": {
                    "question_banks": [6, 7, 8, 9],
                    "resource_packages": [],
                    "features": {
                        "can_create_exam": False,
                        "can_use_ai_grader": False,
                        "can_export_data": False,
                        "can_batch_import": False
                    }
                }
            }
        ]
        
        for plan_data in plans_data:
            # 检查是否已存在
            result = await self.db.execute(
                select(ActivationPlan).where(ActivationPlan.name == plan_data["name"])
            )
            if result.scalar_one_or_none():
                print(f"  ℹ️ 激活计划已存在: {plan_data['name']}")
                continue
            
            plan = ActivationPlan(**plan_data)
            self.db.add(plan)
            await self.db.flush()
            self.created_data["activation_plans"].append(plan)
            print(f"  ✅ 创建激活计划: {plan.name}")
        
        await self.db.commit()
    
    async def create_teachers(self):
        """创建教师账号"""
        print("\n[2/10] 创建教师账号...")
        
        for grade_group, teachers in DEMO_DATA_CONFIG["teachers"].items():
            for teacher_data in teachers:
                # 检查是否已存在
                result = await self.db.execute(
                    select(Account).where(Account.username == teacher_data["username"])
                )
                if result.scalar_one_or_none():
                    print(f"  ℹ️ 教师已存在: {teacher_data['username']}")
                    continue
                
                teacher = Account(
                    username=teacher_data["username"],
                    hashed_password=hash_password("teacher123"),
                    role=UserRole.TEACHER,
                    grade_group=GradeGroup.PRIMARY if grade_group == "primary" else GradeGroup.JUNIOR,
                    account_type=AccountType.PRACTICE,
                    name=teacher_data["name"],
                    is_activated=True,
                    is_active=True
                )
                self.db.add(teacher)
                await self.db.flush()
                self.created_data["teachers"].append(teacher)
                print(f"  ✅ 创建教师: {teacher.username} ({teacher.name})")
        
        await self.db.commit()
    
    async def create_students(self):
        """创建学生账号"""
        print("\n[3/10] 创建学生账号...")
        
        # 生成小学学生（身份证号格式）
        for i in range(DEMO_DATA_CONFIG["students"]["primary"]):
            identity_no = f"4501022015{random.randint(10000000, 99999999):08d}"
            username = identity_no  # 考试账号使用身份证号
            
            result = await self.db.execute(
                select(Account).where(Account.username == username)
            )
            if result.scalar_one_or_none():
                continue
            
            student = Account(
                username=username,
                hashed_password=hash_password(identity_no[-8:]),  # 默认密码后8位
                role=UserRole.STUDENT,
                grade_group=GradeGroup.PRIMARY,
                account_type=AccountType.EXAM,
                identity_no=identity_no,
                name=f"小学学生{i+1:03d}",
                school=random.choice(["南宁市第一小学", "南宁市第二小学", "桂林市实验小学"]),
                is_activated=False,  # 未激活，需要使用激活码
                is_active=True
            )
            self.db.add(student)
            await self.db.flush()
            self.created_data["students"].append(student)
        
        # 生成初中学生
        for i in range(DEMO_DATA_CONFIG["students"]["junior"]):
            identity_no = f"4501022009{random.randint(10000000, 99999999):08d}"
            username = identity_no
            
            result = await self.db.execute(
                select(Account).where(Account.username == username)
            )
            if result.scalar_one_or_none():
                continue
            
            student = Account(
                username=username,
                hashed_password=hash_password(identity_no[-8:]),
                role=UserRole.STUDENT,
                grade_group=GradeGroup.JUNIOR,
                account_type=AccountType.EXAM,
                identity_no=identity_no,
                name=f"初中学生{i+1:03d}",
                school=random.choice(["南宁市第一中学", "南宁市第二中学", "桂林市实验中学"]),
                is_activated=False,
                is_active=True
            )
            self.db.add(student)
            await self.db.flush()
            self.created_data["students"].append(student)
        
        await self.db.commit()
        print(f"  ✅ 创建学生账号: {len(self.created_data['students'])} 个")
    
    async def generate_activation_codes(self):
        """生成激活码"""
        print("\n[4/10] 生成激活码...")
        
        # 获取激活计划
        result = await self.db.execute(select(ActivationPlan))
        plans = result.scalars().all()
        
        for plan in plans:
            # 每个计划生成10个激活码
            for i in range(10):
                # 生成唯一码
                code_str = f"{plan.target_role.upper()[:3]}-{plan.target_grade_group.upper()[:3]}-{random.randint(10000000, 99999999)}"
                
                result = await self.db.execute(
                    select(ActivationCode).where(ActivationCode.code == code_str)
                )
                if result.scalar_one_or_none():
                    continue
                
                code = ActivationCode(
                    code=code_str,
                    plan_id=plan.id,
                    grade_group=plan.target_grade_group,
                    user_role=plan.target_role,
                    is_used=False,
                    source="offline",
                    batch_no=f"BATCH_{plan.target_grade_group.upper()}_001"
                )
                self.db.add(code)
                await self.db.flush()
                self.created_data["activation_codes"].append(code)
        
        await self.db.commit()
        print(f"  ✅ 生成激活码: {len(self.created_data['activation_codes'])} 个")
    
    async def activate_accounts(self):
        """激活部分账号"""
        print("\n[5/10] 激活部分账号...")
        
        # 获取小学学生激活码
        result = await self.db.execute(
            select(ActivationCode)
            .join(ActivationPlan)
            .where(ActivationPlan.target_grade_group == "primary")
            .where(ActivationPlan.target_role == "student")
            .where(ActivationCode.is_used == False)
            .limit(10)
        )
        primary_codes = result.scalars().all()
        
        # 获取初中学生激活码
        result = await self.db.execute(
            select(ActivationCode)
            .join(ActivationPlan)
            .where(ActivationPlan.target_grade_group == "junior")
            .where(ActivationPlan.target_role == "student")
            .where(ActivationCode.is_used == False)
            .limit(10)
        )
        junior_codes = result.scalars().all()
        
        # 激活小学学生
        primary_students = [s for s in self.created_data["students"] 
                           if s.grade_group == GradeGroup.PRIMARY][:10]
        for i, student in enumerate(primary_students):
            if i < len(primary_codes):
                code = primary_codes[i]
                code.is_used = True
                code.used_by_account_id = student.id
                code.used_at = datetime.now()
                
                student.is_activated = True
                student.activation_code_id = code.id
                
                # 创建激活记录
                activation = UserActivation(
                    user_id=student.id,
                    activation_code_id=code.id,
                    plan_id=code.plan_id,
                    permissions=code.plan.permissions if code.plan else {},
                    activated_at=datetime.now(),
                    expire_at=datetime.now() + timedelta(days=code.plan.validity_days if code.plan else 365)
                )
                self.db.add(activation)
        
        # 激活初中学生
        junior_students = [s for s in self.created_data["students"] 
                          if s.grade_group == GradeGroup.JUNIOR][:10]
        for i, student in enumerate(junior_students):
            if i < len(junior_codes):
                code = junior_codes[i]
                code.is_used = True
                code.used_by_account_id = student.id
                code.used_at = datetime.now()
                
                student.is_activated = True
                student.activation_code_id = code.id
                
                activation = UserActivation(
                    user_id=student.id,
                    activation_code_id=code.id,
                    plan_id=code.plan_id,
                    permissions=code.plan.permissions if code.plan else {},
                    activated_at=datetime.now(),
                    expire_at=datetime.now() + timedelta(days=code.plan.validity_days if code.plan else 365)
                )
                self.db.add(activation)
        
        await self.db.commit()
        print(f"  ✅ 激活账号: {len(primary_students) + len(junior_students)} 个")
    
    async def create_question_banks(self):
        """创建题库"""
        print("\n[6/10] 创建题库...")
        
        # 获取教师ID
        result = await self.db.execute(
            select(Account).where(Account.role == UserRole.TEACHER)
        )
        teachers = result.scalars().all()
        primary_teachers = [t for t in teachers if t.grade_group == GradeGroup.PRIMARY]
        junior_teachers = [t for t in teachers if t.grade_group == GradeGroup.JUNIOR]
        
        for grade_group, banks in DEMO_DATA_CONFIG["question_banks"].items():
            teacher_list = primary_teachers if grade_group == "primary" else junior_teachers
            
            for bank_data in banks:
                result = await self.db.execute(
                    select(QuestionBank).where(QuestionBank.name == bank_data["name"])
                )
                if result.scalar_one_or_none():
                    print(f"  ℹ️ 题库已存在: {bank_data['name']}")
                    continue
                
                bank = QuestionBank(
                    name=bank_data["name"],
                    description=bank_data["description"],
                    grade_group=grade_group,
                    status="active",
                    created_by=random.choice(teacher_list).id if teacher_list else 1
                )
                self.db.add(bank)
                await self.db.flush()
                self.created_data["question_banks"].append(bank)
                print(f"  ✅ 创建题库: {bank.name}")
        
        await self.db.commit()
    
    async def create_questions(self):
        """创建试题"""
        print("\n[7/10] 创建试题...")
        
        question_templates = [
            {
                "type": QuestionType.SINGLE_CHOICE,
                "content": "以下哪个选项是正确的？",
                "options": {"A": "选项A内容", "B": "选项B内容", "C": "选项C内容", "D": "选项D内容"},
                "correct_answer": "A",
                "score": 2,
                "analysis": "正确答案是A，因为..."
            },
            {
                "type": QuestionType.MULTIPLE_CHOICE,
                "content": "以下哪些选项是正确的？（多选）",
                "options": {"A": "选项A内容", "B": "选项B内容", "C": "选项C内容", "D": "选项D内容"},
                "correct_answer": "AB",
                "score": 3,
                "analysis": "正确答案是AB，因为..."
            },
            {
                "type": QuestionType.TRUE_FALSE,
                "content": "以下陈述是否正确？",
                "options": {"A": "正确", "B": "错误"},
                "correct_answer": "A",
                "score": 1,
                "analysis": "陈述是正确的，因为..."
            },
            {
                "type": QuestionType.SUBJECTIVE,
                "content": "请阐述你对以下问题的观点...",
                "options": {},
                "correct_answer": "",
                "score": 10,
                "analysis": "评分要点：1.观点明确 2.论述充分 3.逻辑清晰"
            }
        ]
        
        for bank in self.created_data["question_banks"]:
            # 每个题库创建8道题
            for i in range(8):
                template = random.choice(question_templates)
                
                question = Question(
                    bank_id=bank.id,
                    type=template["type"],
                    content=f"{template['content']}（{bank.name}-{i+1}）",
                    options=template["options"],
                    correct_answer=template["correct_answer"],
                    score=template["score"],
                    difficulty=random.choice([DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD]),
                    analysis=template["analysis"],
                    created_by=bank.created_by
                )
                self.db.add(question)
                await self.db.flush()
                self.created_data["questions"].append(question)
        
        await self.db.commit()
        print(f"  ✅ 创建试题: {len(self.created_data['questions'])} 道")
    
    async def create_exams(self):
        """创建考试"""
        print("\n[8/10] 创建考试...")
        
        now = datetime.now()
        
        exams_data = [
            {
                "name": "2024春季初赛-上午场（小学组）",
                "description": "小学组初赛考试",
                "start_time": now + timedelta(days=1),
                "end_time": now + timedelta(days=1, hours=2),
                "duration": 120,
                "status": ExamStatus.PUBLISHED,
                "grade_group": "primary"
            },
            {
                "name": "2024春季初赛-下午场（小学组）",
                "description": "小学组初赛考试",
                "start_time": now + timedelta(days=1, hours=5),
                "end_time": now + timedelta(days=1, hours=7),
                "duration": 120,
                "status": ExamStatus.PUBLISHED,
                "grade_group": "primary"
            },
            {
                "name": "2024春季初赛-上午场（初中组）",
                "description": "初中组初赛考试",
                "start_time": now + timedelta(days=2),
                "end_time": now + timedelta(days=2, hours=2),
                "duration": 120,
                "status": ExamStatus.PUBLISHED,
                "grade_group": "junior"
            }
        ]
        
        # 获取教师
        result = await self.db.execute(select(Account).where(Account.role == UserRole.TEACHER))
        teachers = result.scalars().all()
        
        for exam_data in exams_data:
            result = await self.db.execute(
                select(Exam).where(Exam.name == exam_data["name"])
            )
            if result.scalar_one_or_none():
                print(f"  ℹ️ 考试已存在: {exam_data['name']}")
                continue
            
            grade_teachers = [t for t in teachers 
                            if (exam_data["grade_group"] == "primary" and t.grade_group == GradeGroup.PRIMARY) or
                               (exam_data["grade_group"] == "junior" and t.grade_group == GradeGroup.JUNIOR)]
            
            exam = Exam(
                name=exam_data["name"],
                description=exam_data["description"],
                start_time=exam_data["start_time"],
                end_time=exam_data["end_time"],
                duration=exam_data["duration"],
                status=exam_data["status"],
                created_by=random.choice(grade_teachers).id if grade_teachers else 1
            )
            self.db.add(exam)
            await self.db.flush()
            self.created_data["exams"].append(exam)
            print(f"  ✅ 创建考试: {exam.name}")
        
        await self.db.commit()
    
    async def create_classes(self):
        """创建班级"""
        print("\n[9/10] 创建班级...")
        
        result = await self.db.execute(select(Account).where(Account.role == UserRole.TEACHER))
        teachers = result.scalars().all()
        
        for grade_group, classes in DEMO_DATA_CONFIG["classes"].items():
            grade_teachers = [t for t in teachers 
                            if (grade_group == "primary" and t.grade_group == GradeGroup.PRIMARY) or
                               (grade_group == "junior" and t.grade_group == GradeGroup.JUNIOR)]
            
            for class_data in classes:
                result = await self.db.execute(
                    select(Class).where(Class.name == class_data["name"])
                )
                if result.scalar_one_or_none():
                    print(f"  ℹ️ 班级已存在: {class_data['name']}")
                    continue
                
                class_obj = Class(
                    name=class_data["name"],
                    grade=class_data["grade"],
                    teacher_id=random.choice(grade_teachers).id if grade_teachers else 1
                )
                self.db.add(class_obj)
                await self.db.flush()
                self.created_data["classes"].append(class_obj)
                
                # 添加学生到班级
                grade_students = [s for s in self.created_data["students"] 
                                if (grade_group == "primary" and s.grade_group == GradeGroup.PRIMARY) or
                                   (grade_group == "junior" and s.grade_group == GradeGroup.JUNIOR)]
                
                for student in grade_students[:5]:  # 每个班级5名学生
                    class_student = ClassStudent(
                        class_id=class_obj.id,
                        student_id=student.id
                    )
                    self.db.add(class_student)
                
                print(f"  ✅ 创建班级: {class_obj.name}")
        
        await self.db.commit()
    
    async def create_scores(self):
        """创建成绩数据"""
        print("\n[10/10] 创建成绩数据...")
        print("  ℹ️ 成绩模型不存在，跳过成绩创建")
        print("  💡 提示: 可以在考试完成后通过系统正常流程生成成绩数据")
    
    def print_summary(self):
        """打印数据导入汇总"""
        print("\n📊 数据导入汇总")
        print("-" * 70)
        print(f"  激活计划: {len(self.created_data['activation_plans'])} 个")
        print(f"  教师账号: {len(self.created_data['teachers'])} 个")
        print(f"  学生账号: {len(self.created_data['students'])} 个")
        print(f"  激活码: {len(self.created_data['activation_codes'])} 个")
        print(f"  题库: {len(self.created_data['question_banks'])} 个")
        print(f"  试题: {len(self.created_data['questions'])} 道")
        print(f"  考试: {len(self.created_data['exams'])} 场")
        print(f"  班级: {len(self.created_data['classes'])} 个")
        print(f"  成绩记录: {len(self.created_data['scores'])} 条")
        print("-" * 70)
        print("\n💡 演示账号信息:")
        print("  管理员: admin / admin123")
        print("  教师: teacher_pri_001 / teacher123")
        print("  学生: 使用身份证号登录，密码为身份证后8位")
        print("=" * 70)


async def main():
    """主函数"""
    async with AsyncSessionLocal() as db:
        importer = DemoDataImporter(db)
        await importer.import_all()


if __name__ == "__main__":
    asyncio.run(main())
