from app.whatsapp.brain.nlu import analyze_intent


def test_hinglish_urgency_budget_and_close_mode_signal():
    msg = "bhai website 30k me jaldi chahiye"
    out = analyze_intent(msg, {"last_conversation_summary": ""})
    assert out.get("budget") == 30000
    assert bool(out.get("urgency")) is True
