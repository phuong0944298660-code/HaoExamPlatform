"""
评分服务单元测试

测试覆盖：
- 单选题评分
- 判断题评分
- 多选题评分（三种漏选计分模式）
- 客观题综合评分
- 批量评分
"""

import pytest
from decimal import Decimal

from app.services.scoring_service import ScoringService


# =============================================================================
# 单选题评分测试
# =============================================================================

class TestSingleChoiceScoring:
    """单选题评分测试"""

    def test_single_choice_correct(self):
        """测试单选题回答正确"""
        score = ScoringService.calculate_single_choice_score(
            student_answer="B",
            correct_answer="B",
            score=2.0,
        )
        assert score == 2.0

    def test_single_choice_wrong(self):
        """测试单选题回答错误"""
        score = ScoringService.calculate_single_choice_score(
            student_answer="A",
            correct_answer="B",
            score=2.0,
        )
        assert score == 0.0

    def test_single_choice_case_insensitive(self):
        """测试单选题答案大小写不敏感"""
        score = ScoringService.calculate_single_choice_score(
            student_answer="b",
            correct_answer="B",
            score=2.0,
        )
        assert score == 2.0

    def test_single_choice_empty_answer(self):
        """测试单选题未作答"""
        score = ScoringService.calculate_single_choice_score(
            student_answer="",
            correct_answer="B",
            score=2.0,
        )
        assert score == 0.0

    def test_single_choice_whitespace(self):
        """测试单选题答案带空格"""
        score = ScoringService.calculate_single_choice_score(
            student_answer="  B  ",
            correct_answer="B",
            score=2.0,
        )
        assert score == 2.0


# =============================================================================
# 判断题评分测试
# =============================================================================

class TestJudgmentScoring:
    """判断题评分测试"""

    def test_judgment_correct_true(self):
        """测试判断题回答正确（T）"""
        score = ScoringService.calculate_judgment_score(
            student_answer="T",
            correct_answer="T",
            score=1.0,
        )
        assert score == 1.0

    def test_judgment_correct_false(self):
        """测试判断题回答正确（F）"""
        score = ScoringService.calculate_judgment_score(
            student_answer="F",
            correct_answer="F",
            score=1.0,
        )
        assert score == 1.0

    def test_judgment_wrong(self):
        """测试判断题回答错误"""
        score = ScoringService.calculate_judgment_score(
            student_answer="T",
            correct_answer="F",
            score=1.0,
        )
        assert score == 0.0

    def test_judgment_case_insensitive(self):
        """测试判断题答案大小写不敏感"""
        score = ScoringService.calculate_judgment_score(
            student_answer="t",
            correct_answer="T",
            score=1.0,
        )
        assert score == 1.0


# =============================================================================
# 多选题评分测试 - 全对/全错
# =============================================================================

class TestMultiChoicePerfectScore:
    """多选题全对测试"""

    def test_multi_choice_all_correct(self):
        """测试多选题全对"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="ABC",
            correct_answer="ABC",
            score=3.0,
            scoring_rules={
                "full_score": 3.0,
                "partial_score": 1.0,
                "wrong_score": 0,
                "partial_mode": "fixed",
            }
        )
        assert score == 3.0

    def test_multi_choice_wrong_order(self):
        """测试多选题答案顺序不同（应该算对）"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="CBA",
            correct_answer="ABC",
            score=3.0,
            scoring_rules={
                "full_score": 3.0,
                "partial_score": 1.0,
                "wrong_score": 0,
                "partial_mode": "fixed",
            }
        )
        assert score == 3.0


class TestMultiChoiceWrongAnswer:
    """多选题错选测试"""

    def test_multi_choice_extra_option(self):
        """测试多选题多选（有错误选项）"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="ABCD",  # 多选了D
            correct_answer="ABC",
            score=3.0,
            scoring_rules={
                "full_score": 3.0,
                "partial_score": 1.0,
                "wrong_score": 0,
                "partial_mode": "fixed",
            }
        )
        assert score == 0.0  # 默认错选得0分

    def test_multi_choice_wrong_with_negative_score(self):
        """测试多选题错选有负分设置"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="ABD",  # 选错了一个
            correct_answer="ABC",
            score=3.0,
            scoring_rules={
                "full_score": 3.0,
                "partial_score": 1.0,
                "wrong_score": -1.0,
                "partial_mode": "fixed",
            }
        )
        assert score == -1.0

    def test_multi_choice_empty_answer(self):
        """测试多选题未作答"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="",
            correct_answer="ABC",
            score=3.0,
            scoring_rules={
                "full_score": 3.0,
                "partial_score": 1.0,
                "wrong_score": 0,
                "partial_mode": "fixed",
            }
        )
        assert score == 0.0


# =============================================================================
# 多选题评分测试 - 漏选模式（三种模式）
# =============================================================================

class TestMultiChoicePartialFixed:
    """多选题漏选 - 固定得分模式"""

    def test_partial_fixed_mode(self):
        """测试固定得分模式：漏选统一得 partial_score"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="AB",  # 漏选C
            correct_answer="ABC",
            score=3.0,
            scoring_rules={
                "full_score": 3.0,
                "partial_score": 1.0,
                "wrong_score": 0,
                "partial_mode": "fixed",
            }
        )
        assert score == 1.0  # 固定得1分

    def test_partial_fixed_mode_one_option(self):
        """测试固定得分模式：只选一个正确选项"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="A",  # 只选了一个
            correct_answer="ABC",
            score=3.0,
            scoring_rules={
                "full_score": 3.0,
                "partial_score": 0.5,
                "wrong_score": 0,
                "partial_mode": "fixed",
            }
        )
        assert score == 0.5  # 仍然只得固定的0.5分


class TestMultiChoicePartialPerOption:
    """多选题漏选 - 按选项计分模式"""

    def test_partial_per_option_mode(self):
        """测试按选项计分模式：每答对一个选项得 partial_score"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="AB",  # 答对2个
            correct_answer="ABC",  # 共3个
            score=3.0,
            scoring_rules={
                "full_score": 3.0,
                "partial_score": 1.0,
                "wrong_score": 0,
                "partial_mode": "per_option",
            }
        )
        assert score == 2.0  # 2个 × 1分 = 2分

    def test_partial_per_option_mode_one_option(self):
        """测试按选项计分模式：只选一个"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="A",
            correct_answer="ABC",
            score=3.0,
            scoring_rules={
                "full_score": 3.0,
                "partial_score": 0.5,
                "wrong_score": 0,
                "partial_mode": "per_option",
            }
        )
        assert score == 0.5  # 1个 × 0.5分


class TestMultiChoicePartialProportional:
    """多选题漏选 - 按比例计分模式"""

    def test_partial_proportional_mode(self):
        """测试按比例计分模式：正确比例 × 满分"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="AB",  # 答对2个
            correct_answer="ABCD",  # 共4个
            score=4.0,
            scoring_rules={
                "full_score": 4.0,
                "partial_score": 1.0,
                "wrong_score": 0,
                "partial_mode": "proportional",
            }
        )
        assert score == 2.0  # 2/4 × 4 = 2分

    def test_partial_proportional_mode_half_correct(self):
        """测试按比例计分模式：答对一半"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="AB",
            correct_answer="ABCD",
            score=4.0,
            scoring_rules={
                "full_score": 4.0,
                "partial_score": 1.0,
                "wrong_score": 0,
                "partial_mode": "proportional",
            }
        )
        assert score == 2.0  # 2/4 × 4 = 2分

    def test_partial_proportional_mode_rounding(self):
        """测试按比例计分模式：保留两位小数"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="AB",
            correct_answer="ABC",  # 3个
            score=3.0,
            scoring_rules={
                "full_score": 3.0,
                "partial_score": 1.0,
                "wrong_score": 0,
                "partial_mode": "proportional",
            }
        )
        # 2/3 × 3 = 2.0，应该精确到两位小数
        assert score == 2.0


class TestMultiChoiceDefaultRules:
    """多选题默认规则测试"""

    def test_multi_choice_no_rules(self):
        """测试没有评分规则时使用默认"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="AB",
            correct_answer="ABC",
            score=3.0,
            scoring_rules=None,
        )
        # 默认 partial_mode=fixed, partial_score=0, wrong_score=0
        assert score == 0.0

    def test_multi_choice_unknown_mode(self):
        """测试未知的漏选计分模式"""
        score = ScoringService.calculate_multi_choice_score(
            student_answer="AB",
            correct_answer="ABC",
            score=3.0,
            scoring_rules={
                "full_score": 3.0,
                "partial_score": 1.0,
                "wrong_score": 0,
                "partial_mode": "unknown_mode",
            }
        )
        # 未知模式退化到 fixed
        assert score == 1.0


# =============================================================================
# 客观题综合评分测试
# =============================================================================

class TestObjectiveScoring:
    """客观题综合评分测试"""

    def test_objective_single_choice(self):
        """测试客观题评分 - 单选"""
        score = ScoringService.calculate_objective_score(
            question_type="single_choice",
            student_answer="B",
            correct_answer="B",
            score=2.0,
        )
        assert score == 2.0

    def test_objective_judgment(self):
        """测试客观题评分 - 判断"""
        score = ScoringService.calculate_objective_score(
            question_type="judgment",
            student_answer="T",
            correct_answer="T",
            score=1.0,
        )
        assert score == 1.0

    def test_objective_multi_choice(self):
        """测试客观题评分 - 多选"""
        score = ScoringService.calculate_objective_score(
            question_type="multi_choice",
            student_answer="AB",
            correct_answer="ABC",
            score=3.0,
            scoring_rules={
                "partial_mode": "fixed",
                "partial_score": 1.0,
                "wrong_score": 0,
            }
        )
        assert score == 1.0

    def test_objective_unknown_type(self):
        """测试未知题型"""
        score = ScoringService.calculate_objective_score(
            question_type="unknown_type",
            student_answer="something",
            correct_answer="correct",
            score=2.0,
        )
        assert score == 0.0  # 未知题型返回0分

    def test_objective_subjective(self):
        """测试主观题不自动评分"""
        score = ScoringService.calculate_objective_score(
            question_type="subjective",
            student_answer="一段作文...",
            correct_answer="",
            score=10.0,
        )
        assert score == 0.0  # 主观题不自动评分，返回0


# =============================================================================
# 批量评分测试
# =============================================================================

class TestBatchScoring:
    """批量评分测试"""

    def test_batch_score_mixed_questions(self):
        """测试批量评分混合题型"""
        questions = [
            {
                "question_id": 1,
                "question_type": "single_choice",
                "correct_answer": "B",
                "score": 2.0,
            },
            {
                "question_id": 2,
                "question_type": "multi_choice",
                "correct_answer": "ABC",
                "score": 3.0,
                "scoring_rules": {
                    "partial_mode": "fixed",
                    "partial_score": 1.0,
                    "wrong_score": 0,
                }
            },
            {
                "question_id": 3,
                "question_type": "judgment",
                "correct_answer": "T",
                "score": 1.0,
            },
            {
                "question_id": 4,
                "question_type": "subjective",
                "correct_answer": "",
                "score": 10.0,
            },
        ]
        
        answers = {
            "1": {"answer": "B"},        # 单选正确，得2分
            "2": {"answer": "AB"},       # 多选漏选，得1分
            "3": {"answer": "T"},        # 判断正确，得1分
            "4": {"answer": "作文内容"}, # 主观题，不评分
        }
        
        total_score, details = ScoringService.score_objective_questions(questions, answers)
        
        assert total_score == 4.0  # 2 + 1 + 1 + 0
        assert len(details) == 4
        
        # 验证详情
        assert details[0]["auto_score"] == 2.0
        assert details[0]["is_objective"] is True
        
        assert details[1]["auto_score"] == 1.0
        assert details[1]["is_objective"] is True
        
        assert details[2]["auto_score"] == 1.0
        assert details[2]["is_objective"] is True
        
        assert details[3]["auto_score"] is None  # 主观题无自动评分
        assert details[3]["is_objective"] is False

    def test_batch_score_all_correct(self):
        """测试批量评分全部正确"""
        questions = [
            {
                "question_id": 1,
                "question_type": "single_choice",
                "correct_answer": "A",
                "score": 2.0,
            },
            {
                "question_id": 2,
                "question_type": "judgment",
                "correct_answer": "F",
                "score": 1.0,
            },
        ]
        
        answers = {
            "1": {"answer": "A"},
            "2": {"answer": "F"},
        }
        
        total_score, details = ScoringService.score_objective_questions(questions, answers)
        
        assert total_score == 3.0
        assert all(d["auto_score"] == d["max_score"] for d in details)

    def test_batch_score_all_wrong(self):
        """测试批量评分全部错误"""
        questions = [
            {
                "question_id": 1,
                "question_type": "single_choice",
                "correct_answer": "A",
                "score": 2.0,
            },
            {
                "question_id": 2,
                "question_type": "judgment",
                "correct_answer": "T",
                "score": 1.0,
            },
        ]
        
        answers = {
            "1": {"answer": "B"},
            "2": {"answer": "F"},
        }
        
        total_score, details = ScoringService.score_objective_questions(questions, answers)
        
        assert total_score == 0.0
        assert all(d["auto_score"] == 0.0 for d in details if d["is_objective"])

    def test_batch_score_empty_answers(self):
        """测试批量评分无答案"""
        questions = [
            {
                "question_id": 1,
                "question_type": "single_choice",
                "correct_answer": "A",
                "score": 2.0,
            },
        ]
        
        answers = {}  # 空答案
        
        total_score, details = ScoringService.score_objective_questions(questions, answers)
        
        assert total_score == 0.0
        assert details[0]["auto_score"] == 0.0
        assert details[0]["student_answer"] == ""  # 未作答

    def test_batch_score_missing_answer(self):
        """测试批量评分缺少部分答案"""
        questions = [
            {
                "question_id": 1,
                "question_type": "single_choice",
                "correct_answer": "A",
                "score": 2.0,
            },
            {
                "question_id": 2,
                "question_type": "single_choice",
                "correct_answer": "B",
                "score": 2.0,
            },
        ]
        
        answers = {
            "1": {"answer": "A"},  # 只回答了第一题
        }
        
        total_score, details = ScoringService.score_objective_questions(questions, answers)
        
        assert total_score == 2.0  # 只得了第一题的分数
        assert details[0]["auto_score"] == 2.0
        assert details[1]["auto_score"] == 0.0  # 第二题未作答

    def test_batch_score_rounding(self):
        """测试批量评分总分保留两位小数"""
        questions = [
            {
                "question_id": 1,
                "question_type": "multi_choice",
                "correct_answer": "ABC",
                "score": 3.0,
                "scoring_rules": {
                    "partial_mode": "proportional",
                }
            },
        ]
        
        answers = {
            "1": {"answer": "AB"},  # 2/3 * 3 = 2.0
        }
        
        total_score, details = ScoringService.score_objective_questions(questions, answers)
        
        # 验证总分是两位小数
        assert isinstance(total_score, float)
        # Decimal量化应该保留两位小数
        assert total_score == 2.0
