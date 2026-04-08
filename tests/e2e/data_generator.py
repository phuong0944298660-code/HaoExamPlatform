"""
测试数据生成器

提供测试所需的各类数据生成函数：
- 学生名单生成
- 题目数据生成
- 模拟答卷数据生成
"""

import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional


class TestDataGenerator:
    """测试数据生成器"""
    
    # 常用姓氏和名字
    SURNAMES = [
        "王", "李", "张", "刘", "陈", "杨", "黄", "赵", "吴", "周",
        "徐", "孙", "马", "朱", "胡", "郭", "何", "高", "林", "罗",
        "郑", "梁", "谢", "宋", "唐", "许", "韩", "冯", "邓", "曹"
    ]
    
    NAMES = [
        "伟", "芳", "娜", "秀英", "敏", "静", "丽", "强", "磊", "军",
        "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀兰", "霞",
        "平", "刚", "桂英", "文", "辉", "鑫", "宇", "博", "浩", "然",
        "思", "琪", "雨", "晨", "轩", "昊", "瑞", "嘉", "泽", "梓"
    ]
    
    SCHOOLS = [
        "南宁市第一中学", "南宁市第二中学", "南宁市第三中学",
        "桂林市第一中学", "桂林市第二中学", "桂林市第十八中学",
        "柳州市第一中学", "柳州市第二中学", "柳州市高级中学",
        "北海市第一中学", "北海中学", "钦州市第一中学",
        "玉林市第一中学", "贵港市高级中学", "百色市第一中学"
    ]
    
    REGIONS = [
        "南宁市青秀区", "南宁市西乡塘区", "南宁市兴宁区",
        "桂林市秀峰区", "桂林市象山区", "桂林市七星区",
        "柳州市城中区", "柳州市鱼峰区", "柳州市柳南区",
        "北海市海城区", "北海市银海区", "钦州市钦南区"
    ]
    
    @classmethod
    def generate_id_number(cls, age: int = 15) -> str:
        """
        生成模拟身份证号
        
        Args:
            age: 年龄（默认为15岁，初中生）
        
        Returns:
            18位身份证号
        """
        # 广西地区代码
        area_codes = [
            "450100", "450200", "450300", "450400", "450500",
            "450600", "450700", "450800", "450900"
        ]
        
        area_code = random.choice(area_codes)
        
        # 计算出生日期
        birth_year = datetime.now().year - age
        birth_month = random.randint(1, 12)
        birth_day = random.randint(1, 28)
        birth_date = f"{birth_year:04d}{birth_month:02d}{birth_day:02d}"
        
        # 顺序码
        sequence = random.randint(1, 999)
        sequence_str = f"{sequence:03d}"
        
        # 前17位
        id_17 = area_code + birth_date + sequence_str
        
        # 计算校验码
        weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
        check_codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
        
        sum_value = sum(int(id_17[i]) * weights[i] for i in range(17))
        check_code = check_codes[sum_value % 11]
        
        return id_17 + check_code
    
    @classmethod
    def generate_student_name(cls) -> str:
        """生成学生姓名"""
        surname = random.choice(cls.SURNAMES)
        # 70%概率双字名，30%概率单字名
        if random.random() < 0.7:
            name = random.choice(cls.NAMES) + random.choice(cls.NAMES)
        else:
            name = random.choice(cls.NAMES)
        return surname + name
    
    @classmethod
    def generate_student(cls, age: int = 15) -> Dict:
        """
        生成单个学生信息
        
        Args:
            age: 学生年龄
            
        Returns:
            学生信息字典
        """
        return {
            "identity_no": cls.generate_id_number(age),
            "name": cls.generate_student_name(),
            "school": random.choice(cls.SCHOOLS),
            "region": random.choice(cls.REGIONS)
        }
    
    @classmethod
    def generate_students(cls, count: int, age: int = 15) -> List[Dict]:
        """
        批量生成学生信息
        
        Args:
            count: 生成数量
            age: 学生年龄
            
        Returns:
            学生信息列表
        """
        students = []
        used_ids = set()
        
        while len(students) < count:
            student = cls.generate_student(age)
            if student["identity_no"] not in used_ids:
                used_ids.add(student["identity_no"])
                students.append(student)
        
        return students
    
    @classmethod
    def generate_practice_accounts(cls, count: int, prefix: str = "student") -> List[Dict]:
        """
        生成练习账号
        
        Args:
            count: 生成数量
            prefix: 用户名前缀
            
        Returns:
            账号信息列表
        """
        accounts = []
        for i in range(count):
            accounts.append({
                "username": f"{prefix}_{i+1:04d}",
                "name": cls.generate_student_name(),
                "school": random.choice(cls.SCHOOLS)
            })
        return accounts


class QuestionDataGenerator:
    """题目数据生成器"""
    
    QUESTION_TEMPLATES = {
        "single_choice": [
            "下列关于{}的说法，正确的是？",
            "{}的主要特征是什么？",
            "以下哪个选项描述了{}？",
            "{}的定义是下列哪项？",
        ],
        "multi_choice": [
            "下列关于{}的说法，正确的有？（多选）",
            "{}的特点包括哪些？（多选）",
            "以下哪些是{}的特性？（多选）",
        ],
        "judgment": [
            "{}是正确的。",
            "所有{}都具有相同的性质。",
            "{}永远不变。",
        ],
        "subjective": [
            "请简述{}的主要特点。",
            "论述{}的重要性和应用。",
            "结合实际，谈谈你对{}的理解。",
        ]
    }
    
    TOPICS = [
        "人工智能", "机器学习", "深度学习", "神经网络",
        "Python编程", "数据结构", "算法", "数据库",
        "云计算", "大数据", "物联网", "区块链",
        "数学", "物理", "化学", "生物"
    ]
    
    @classmethod
    def generate_single_choice_question(
        cls,
        question_bank_id: int,
        difficulty: str = "medium"
    ) -> Dict:
        """生成单选题"""
        topic = random.choice(cls.TOPICS)
        template = random.choice(cls.QUESTION_TEMPLATES["single_choice"])
        
        options = [
            {"label": "A", "content": f"{topic}的定义A"},
            {"label": "B", "content": f"{topic}的定义B"},
            {"label": "C", "content": f"{topic}的定义C"},
            {"label": "D", "content": f"{topic}的定义D"}
        ]
        
        return {
            "content": template.format(topic),
            "images": [],
            "question_type": "single_choice",
            "options": options,
            "correct_answer": random.choice(["A", "B", "C", "D"]),
            "default_score": random.choice([1.0, 2.0, 3.0]),
            "answer_analysis": f"本题考查{topic}的基础知识。",
            "difficulty": difficulty,
            "tags": [topic, "单选", difficulty],
            "question_bank_id": question_bank_id
        }
    
    @classmethod
    def generate_multi_choice_question(
        cls,
        question_bank_id: int,
        difficulty: str = "medium"
    ) -> Dict:
        """生成多选题"""
        topic = random.choice(cls.TOPICS)
        template = random.choice(cls.QUESTION_TEMPLATES["multi_choice"])
        
        options = [
            {"label": "A", "content": f"{topic}特性A"},
            {"label": "B", "content": f"{topic}特性B"},
            {"label": "C", "content": f"{topic}特性C"},
            {"label": "D", "content": f"{topic}特性D"}
        ]
        
        # 随机选择正确答案组合
        correct_count = random.randint(2, 4)
        correct_labels = sorted(random.sample(["A", "B", "C", "D"], correct_count))
        
        return {
            "content": template.format(topic),
            "images": [],
            "question_type": "multi_choice",
            "options": options,
            "correct_answer": ",".join(correct_labels),
            "scoring_rules": {
                "full_score": 3.0,
                "partial_score": 1.5 if correct_count == 2 else 1.0,
                "wrong_score": 0,
                "partial_mode": "fixed"
            },
            "default_score": 3.0,
            "answer_analysis": f"本题考查{topic}的多方面特性。",
            "difficulty": difficulty,
            "tags": [topic, "多选", difficulty],
            "question_bank_id": question_bank_id
        }
    
    @classmethod
    def generate_judgment_question(
        cls,
        question_bank_id: int,
        difficulty: str = "easy"
    ) -> Dict:
        """生成判断题"""
        topic = random.choice(cls.TOPICS)
        template = random.choice(cls.QUESTION_TEMPLATES["judgment"])
        
        return {
            "content": template.format(topic),
            "images": [],
            "question_type": "judgment",
            "correct_answer": random.choice(["T", "F"]),
            "default_score": 1.0,
            "answer_analysis": f"请查阅{topic}相关资料。",
            "difficulty": difficulty,
            "tags": [topic, "判断", difficulty],
            "question_bank_id": question_bank_id
        }
    
    @classmethod
    def generate_subjective_question(
        cls,
        question_bank_id: int,
        difficulty: str = "medium"
    ) -> Dict:
        """生成主观题"""
        topic = random.choice(cls.TOPICS)
        template = random.choice(cls.QUESTION_TEMPLATES["subjective"])
        
        return {
            "content": template.format(topic),
            "images": [],
            "question_type": "subjective",
            "default_score": random.choice([5.0, 8.0, 10.0, 15.0]),
            "answer_analysis": "开放性问题，评分要点包括：理解深度、逻辑清晰度、实际应用等。",
            "difficulty": difficulty,
            "tags": [topic, "主观题", difficulty],
            "question_bank_id": question_bank_id
        }
    
    @classmethod
    def generate_mixed_questions(
        cls,
        question_bank_id: int,
        count: int = 20
    ) -> List[Dict]:
        """
        生成混合类型题目
        
        Args:
            question_bank_id: 题库ID
            count: 题目数量
            
        Returns:
            题目列表
        """
        questions = []
        
        # 分布：单选40%、多选30%、判断20%、主观10%
        distribution = {
            "single_choice": int(count * 0.4),
            "multi_choice": int(count * 0.3),
            "judgment": int(count * 0.2),
            "subjective": int(count * 0.1)
        }
        
        # 调整数量确保总数正确
        while sum(distribution.values()) < count:
            distribution["single_choice"] += 1
        
        for _ in range(distribution["single_choice"]):
            questions.append(cls.generate_single_choice_question(question_bank_id))
        
        for _ in range(distribution["multi_choice"]):
            questions.append(cls.generate_multi_choice_question(question_bank_id))
        
        for _ in range(distribution["judgment"]):
            questions.append(cls.generate_judgment_question(question_bank_id))
        
        for _ in range(distribution["subjective"]):
            questions.append(cls.generate_subjective_question(question_bank_id))
        
        # 打乱顺序
        random.shuffle(questions)
        
        return questions[:count]


class AnswerDataGenerator:
    """答卷数据生成器"""
    
    @classmethod
    def generate_single_choice_answer(cls, question: Dict, correct_rate: float = 0.7) -> str:
        """
        生成单选题答案
        
        Args:
            question: 题目数据
            correct_rate: 正确率
            
        Returns:
            答案选项
        """
        if random.random() < correct_rate:
            return question["correct_answer"]
        else:
            options = [opt["label"] for opt in question.get("options", [])]
            wrong_options = [opt for opt in options if opt != question["correct_answer"]]
            return random.choice(wrong_options) if wrong_options else "A"
    
    @classmethod
    def generate_multi_choice_answer(cls, question: Dict, correct_rate: float = 0.6) -> str:
        """
        生成多选题答案
        
        Args:
            question: 题目数据
            correct_rate: 正确率
            
        Returns:
            答案选项（逗号分隔）
        """
        if random.random() < correct_rate:
            return question["correct_answer"]
        else:
            options = [opt["label"] for opt in question.get("options", [])]
            # 随机选择1-3个选项
            selected = random.sample(options, random.randint(1, min(3, len(options))))
            return ",".join(sorted(selected))
    
    @classmethod
    def generate_judgment_answer(cls, question: Dict, correct_rate: float = 0.8) -> str:
        """
        生成判断题答案
        
        Args:
            question: 题目数据
            correct_rate: 正确率
            
        Returns:
            T或F
        """
        if random.random() < correct_rate:
            return question["correct_answer"]
        else:
            return "F" if question["correct_answer"] == "T" else "T"
    
    @classmethod
    def generate_subjective_answer(cls, question: Dict, quality: str = "medium") -> str:
        """
        生成主观题答案
        
        Args:
            question: 题目数据
            quality: 答案质量 (low/medium/high)
            
        Returns:
            答案文本
        """
        answers = {
            "low": [
                "不太清楚这个问题。",
                "我没有学过这个内容。",
                "答案是显而易见的。"
            ],
            "medium": [
                "这个问题需要从多个角度考虑。首先...其次...",
                "关于这个问题，我认为主要有以下几点...",
                "这是一个重要的知识点，涉及到..."
            ],
            "high": [
                """这是一个非常深刻的问题。从理论层面来看，它涉及到基础概念的深入理解；
                从实践层面来看，它在实际应用中有着广泛的价值。具体来说...""",
                """要全面回答这个问题，需要从历史发展、理论基础、实际应用三个维度来分析：
                1. 历史发展：...
                2. 理论基础：...
                3. 实际应用：..."""
            ]
        }
        
        return random.choice(answers.get(quality, answers["medium"]))
    
    @classmethod
    def generate_exam_answers(
        cls,
        questions: List[Dict],
        correct_rate: float = 0.75,
        subjective_quality: str = "medium"
    ) -> List[Dict]:
        """
        生成完整考试答案
        
        Args:
            questions: 题目列表
            correct_rate: 客观题正确率
            subjective_quality: 主观题答案质量
            
        Returns:
            答案列表
        """
        answers = []
        
        for question in questions:
            q_type = question.get("question_type")
            q_id = question.get("id")
            
            if q_type == "single_choice":
                answer = cls.generate_single_choice_answer(question, correct_rate)
            elif q_type == "multi_choice":
                answer = cls.generate_multi_choice_answer(question, correct_rate)
            elif q_type == "judgment":
                answer = cls.generate_judgment_answer(question, correct_rate)
            elif q_type == "subjective":
                answer = cls.generate_subjective_answer(question, subjective_quality)
            else:
                answer = ""
            
            answers.append({
                "question_id": q_id,
                "answer": answer,
                "uploaded_files": [] if q_type != "subjective" else []
            })
        
        return answers


# 便捷函数

def generate_test_students(count: int = 10) -> List[Dict]:
    """生成测试学生名单"""
    return TestDataGenerator.generate_students(count)

def generate_test_questions(
    question_bank_id: int,
    count: int = 20
) -> List[Dict]:
    """生成测试题目"""
    return QuestionDataGenerator.generate_mixed_questions(question_bank_id, count)

def generate_test_answers(
    questions: List[Dict],
    correct_rate: float = 0.75
) -> List[Dict]:
    """生成测试答卷"""
    return AnswerDataGenerator.generate_exam_answers(questions, correct_rate)


if __name__ == "__main__":
    # 测试数据生成
    print("=" * 50)
    print("测试数据生成器演示")
    print("=" * 50)
    
    # 生成学生
    print("\n1. 生成5个测试学生：")
    students = generate_test_students(5)
    for i, student in enumerate(students, 1):
        print(f"   {i}. {student['name']} ({student['identity_no']}) - {student['school']}")
    
    # 生成题目
    print("\n2. 生成3道测试题目：")
    questions = [
        QuestionDataGenerator.generate_single_choice_question(1),
        QuestionDataGenerator.generate_multi_choice_question(1),
        QuestionDataGenerator.generate_subjective_question(1)
    ]
    for i, q in enumerate(questions, 1):
        print(f"   {i}. [{q['question_type']}] {q['content'][:30]}...")
    
    # 生成答案
    print("\n3. 生成答卷：")
    answers = AnswerDataGenerator.generate_exam_answers(questions)
    for i, a in enumerate(answers, 1):
        print(f"   {i}. 题目{a['question_id']}: {a['answer'][:30]}...")
