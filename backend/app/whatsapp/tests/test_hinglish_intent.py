from app.whatsapp.brain.nlu import analyze_intent
from app.whatsapp.utils.safety import should_suppress_duplicate


def test_hinglish_urgency_budget_and_close_mode_signal():
    msg = "bhai website 30k me jaldi chahiye"
    out = analyze_intent(msg, {})
    assert out.get("budget") == 30000
    assert bool(out.get("urgency")) is True
    assert out.get("service") == "website"


def test_wants_call_hinglish():
    out = analyze_intent("bhai call pe baat kar lete hai", {})
    assert out.get("wants_call") is True
    assert out.get("ready_to_buy") is False


def test_ready_to_buy():
    out = analyze_intent("start kar do", {})
    assert out.get("ready_to_buy") is True


def test_ready_to_buy_trust_signals():
    assert analyze_intent("i trust you, do it", {})["ready_to_buy"] is True
    assert analyze_intent("jaldi karo", {})["ready_to_buy"] is True


def test_frustrated_abuse():
    out = analyze_intent("chutiya", {})
    assert out.get("frustrated") is True


def test_frustrated_soft_insult():
    assert analyze_intent("kya faltu baat kar rhe ho", {})["frustrated"] is True
    assert analyze_intent("pagal hai kya", {})["frustrated"] is True


def test_wants_human_hinglish():
    out = analyze_intent("owner se baat kara do", {})
    assert out.get("wants_human") is True


def test_call_karao():
    out = analyze_intent("call karao", {})
    assert out.get("wants_call") is True


def test_mygate_under_budget():
    out = analyze_intent("Need app like mygate under 80k", {})
    assert out.get("service") == "app"
    assert out.get("budget") == 80000


def test_unclear_message():
    assert analyze_intent("???", {})["unclear_message"] is True


def test_re_engagement_not_negative():
    assert analyze_intent("still interested", {})["re_engagement"] is True
    assert analyze_intent("not interested anymore", {})["re_engagement"] is False


def test_budget_objection():
    assert analyze_intent("zyada ho gaya, discount milega?", {})["budget_objection"] is True


def test_duplicate_suppress_same_inbound_only():
    now = 1_000_000
    assert should_suppress_duplicate("a", "a", "call", "call", now - 5, now, "hi", "hi", window_sec=12) is True
    assert should_suppress_duplicate("a", "a", "call", "call", now - 5, now, "hi", "hello", window_sec=12) is False
    assert should_suppress_duplicate("a", "b", "call", "call", now - 5, now, "hi", "hi", window_sec=12) is False
    assert should_suppress_duplicate("a", "a", "call", "call", now - 20, now, "hi", "hi", window_sec=12) is False


def test_time_slot_signal():
    assert analyze_intent("8pm", {})["time_slot"] is True
