# Hand-picked names for traditions the open datasets barely cover: Chinese (pinyin, tone marks dropped),
# Korean (Revised Romanization) and Igbo (Nigeria), whose names are usually short sentences about God or family.
# Chinese meanings are the usual sense of the characters. Most Korean names take their meaning from
# whichever hanja a family picks, so only native Korean names (Haneul, Byeol...) carry a meaning here.
# (name, gender m/f/u, language, meaning)

CHINESE = [
    ('Wei', 'm', 'great, extraordinary'), ('Jie', 'm', 'outstanding, heroic'), ('Hao', 'm', 'vast, grand'),
    ('Ming', 'u', 'bright'), ('Jun', 'm', 'handsome, talented'), ('Tao', 'm', 'great wave'), ('Qiang', 'm', 'strong'),
    ('Peng', 'm', 'roc, a giant mythical bird'), ('Yu', 'u', 'universe'), ('Long', 'm', 'dragon'), ('Kai', 'm', 'triumphant'),
    ('Bo', 'm', 'broad, learned'), ('Chen', 'u', 'morning'), ('Yang', 'm', 'sun, sunshine'), ('Yi', 'u', 'resolute, firm'),
    ('Zhi', 'm', 'will, ambition'), ('Wen', 'u', 'culture, literature'), ('Tian', 'u', 'sky, heaven'), ('Hui', 'u', 'wise, bright'),
    ('Xin', 'u', 'happy, joyful'), ('Jian', 'm', 'healthy, strong'), ('Feng', 'm', 'wind; also peak'), ('Lei', 'm', 'thunder'),
    ('Rui', 'u', 'sharp-witted, auspicious'), ('Zhen', 'u', 'precious, treasure'), ('Bin', 'm', 'refined and elegant'),
    ('Cheng', 'm', 'success, accomplished'), ('Hong', 'u', 'grand, vast'), ('Kang', 'm', 'healthy, peaceful'), ('Le', 'u', 'joyful'),
    ('An', 'u', 'peace, calm'), ('Ning', 'u', 'tranquil'), ('Haoran', 'm', 'vast and upright'), ('Zihan', 'u', 'catalpa tree; to contain'),
    ('Zixuan', 'u', 'child of high bearing'), ('Yuxuan', 'u', 'universe; lofty'), ('Junjie', 'm', 'handsome and outstanding'),
    ('Mingze', 'm', 'bright and benevolent'), ('Haoyu', 'm', 'vast universe'), ('Yichen', 'u', 'one morning'), ('Ruoxi', 'f', 'like the dawn'),
    ('Mei', 'f', 'beautiful; also plum blossom'), ('Li', 'f', 'beautiful'), ('Jing', 'f', 'quiet, calm'), ('Ting', 'f', 'graceful'),
    ('Xue', 'f', 'snow'), ('Ling', 'f', 'tinkling of jade'), ('Fang', 'f', 'fragrant'), ('Xiu', 'f', 'elegant, beautiful'),
    ('Xiao', 'f', 'dawn'), ('Si', 'f', 'thought'), ('Qi', 'f', 'fine jade'), ('Jia', 'f', 'excellent, good'), ('Lan', 'f', 'orchid'),
    ('Lian', 'f', 'lotus'), ('Yan', 'f', 'swallow (the bird)'), ('Xia', 'f', 'rosy clouds'), ('Wan', 'f', 'gentle, graceful'),
    ('Ying', 'f', 'clever; also flower'), ('Meng', 'f', 'dream'), ('Yue', 'f', 'moon'), ('Xing', 'u', 'star'), ('Yun', 'f', 'cloud'),
    ('Xinyi', 'f', 'happy and joyful'), ('Yinuo', 'f', 'a promise'), ('Shihan', 'f', 'poetry and grace'), ('Meilin', 'f', 'beautiful jade'),
    ('Xiuying', 'f', 'elegant and brave'), ('Jiayi', 'f', 'good and joyful'), ('Huimin', 'f', 'wise and quick'), ('Yuting', 'f', 'graceful jade'),
]

KOREAN = [
    ('Min-jun', 'm', ''), ('Seo-jun', 'm', ''), ('Do-yun', 'm', ''), ('Ye-jun', 'm', ''), ('Si-woo', 'm', ''), ('Ha-joon', 'm', ''),
    ('Ji-ho', 'm', ''), ('Joo-won', 'm', ''), ('Eun-woo', 'm', ''), ('Jun-seo', 'm', ''), ('Hyun-woo', 'm', ''), ('Ji-hoon', 'm', ''),
    ('Woo-jin', 'm', ''), ('Gun-woo', 'm', ''), ('Seung-min', 'm', ''), ('Jae-won', 'm', ''), ('Dong-hyun', 'm', ''), ('Tae-yang', 'm', ''),
    ('Min-ho', 'm', ''), ('Jin-woo', 'm', ''), ('Sung-min', 'm', ''), ('Young-ho', 'm', ''), ('Sang-woo', 'm', ''), ('Jae-hyun', 'm', ''),
    ('Seo-yeon', 'f', ''), ('Seo-yun', 'f', ''), ('Ji-woo', 'u', ''), ('Seo-hyun', 'f', ''), ('Min-seo', 'f', ''), ('Ha-eun', 'f', ''),
    ('Ha-yoon', 'f', ''), ('Ji-yoo', 'f', ''), ('Yoon-seo', 'f', ''), ('Chae-won', 'f', ''), ('Su-ah', 'f', ''), ('Ji-an', 'f', ''),
    ('Ji-min', 'u', ''), ('Yu-na', 'f', ''), ('Seo-ah', 'f', ''), ('Ye-eun', 'f', ''), ('Soo-min', 'f', ''), ('Ji-hye', 'f', ''),
    ('Eun-ji', 'f', ''), ('Hye-jin', 'f', ''), ('Min-ji', 'f', ''), ('Yoo-jin', 'f', ''), ('Ji-young', 'f', ''), ('Soo-jin', 'f', ''),
    # Native Korean words used as names, so they have a meaning of their own.
    ('Haneul', 'u', 'sky'), ('Byeol', 'f', 'star'), ('Bom', 'f', 'spring'), ('Bora', 'f', 'purple'), ('Areum', 'f', 'beauty'),
    ('Nari', 'f', 'lily'), ('Dasom', 'f', 'love'), ('Saetbyeol', 'f', 'morning star'), ('Haru', 'u', 'day'), ('Nabi', 'f', 'butterfly'),
    ('Seulgi', 'f', 'wisdom'), ('Yeseul', 'f', 'dew'), ('Bit-na', 'f', 'shining'), ('Garam', 'm', 'river'), ('Han-gyeol', 'm', 'steadfast'),
]

IGBO = [
    ('Chinedu', 'm', 'God leads'), ('Chiamaka', 'f', 'God is beautiful'), ('Obinna', 'm', "father's heart"), ('Ngozi', 'f', 'blessing'),
    ('Adaeze', 'f', 'princess, daughter of a king'), ('Chidi', 'm', 'God exists'), ('Nnamdi', 'm', 'my father is alive'),
    ('Uchenna', 'u', "God's will"), ('Ifeoma', 'f', 'a good thing'), ('Amaka', 'f', 'beautiful'), ('Ebuka', 'm', 'God is great'),
    ('Kelechi', 'u', 'thank God'), ('Nkechi', 'f', "God's own"), ('Chioma', 'f', 'good God'), ('Ikenna', 'm', "father's strength"),
    ('Chukwuemeka', 'm', 'God has done great things'), ('Emeka', 'm', 'great deeds'), ('Oluchi', 'f', "God's work"),
    ('Adanna', 'f', "her father's daughter"), ('Nneka', 'f', 'mother is supreme'), ('Ugo', 'u', 'eagle; glory'),
    ('Chibuike', 'm', 'God is my strength'), ('Ifeanyi', 'm', 'nothing is impossible for God'), ('Kosisochukwu', 'u', 'as it pleases God'),
    ('Chimamanda', 'f', 'my God will not fail'), ('Ebere', 'f', 'mercy'), ('Ada', 'f', 'first daughter'), ('Obioma', 'u', 'kind heart'),
    ('Tobenna', 'm', 'praise the father'), ('Chisom', 'u', 'God is with me'), ('Nkem', 'u', 'my own'), ('Chinwe', 'f', 'God owns'),
    ('Chinonso', 'u', 'God is near'), ('Akachi', 'u', 'hand of God'), ('Chidera', 'u', 'what God has written'),
    ('Amarachi', 'f', "God's grace"), ('Ugochi', 'f', "God's glory"), ('Chukwudi', 'm', 'God exists'), ('Somtochukwu', 'u', 'praise God with me'),
    ('Ozioma', 'f', 'good news'), ('Udoka', 'u', 'peace is greater'), ('Nnaemeka', 'm', 'the father has done great things'),
    ('Obiora', 'm', 'heart of the people'), ('Chiedza', 'f', 'light'), ('Onyinye', 'f', 'gift'), ('Uzoma', 'u', 'good road, good path'),
]

ROWS = ([(n, 'Chinese', g, m) for n, g, m in CHINESE] + [(n, 'Korean', g, m) for n, g, m in KOREAN]
        + [(n, 'Igbo', g, m) for n, g, m in IGBO])
