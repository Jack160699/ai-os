def detect_language(message: str) -> str:
    txt = (message or "").lower()
    if any(ch in txt for ch in "अआइईउऊएऐओऔकखगघचछजझटठडढतथदधनपफबभमयरलवशषसह"):
        return "hindi"
    hinglish_tokens = {"kya", "hai", "nahi", "karna", "aap", "haan", "bhai", "chahiye"}
    if any(tok in txt.split() for tok in hinglish_tokens):
        return "hinglish"
    return "english"
