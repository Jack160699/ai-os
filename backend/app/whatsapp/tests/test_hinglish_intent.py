from app.whatsapp.brain.nlu import analyze_intent


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


def test_frustrated_abuse():
    out = analyze_intent("chutiya", {})
    assert out.get("frustrated") is True


def test_wants_human_hinglish():
    out = analyze_intent("owner se baat kara do", {})
    assert out.get("wants_human") is True
