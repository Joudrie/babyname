# Hand-picked Chinese (pinyin, tone marks dropped) and Korean (Revised Romanization) given names.
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

ROWS = [(n, 'Chinese', g, m) for n, g, m in CHINESE] + [(n, 'Korean', g, m) for n, g, m in KOREAN]
