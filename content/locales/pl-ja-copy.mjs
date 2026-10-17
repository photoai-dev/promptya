import {editorial} from '../collections.mjs';
const names={
'Animaux réalistes':['Realistyczne zwierzęta','リアルな動物'],
'Bonbons & confiserie':['Cukierki i słodycze','キャンディーとスイーツ'],
'Automobile':['Samochody','自動車'],
'Affiches de cinéma':['Plakaty filmowe','映画ポスター'],
'Festival désert & Coachella':['Festiwal na pustyni i Coachella','砂漠のフェスとコーチェラ'],
'Football international':['Piłka nożna reprezentacyjna','世界のサッカー'],
'Animation féerique':['Baśniowa animacja','おとぎ話風アニメーション'],
'Animation 3D féerique':['Baśniowa animacja 3D','おとぎ話風3Dアニメーション'],
'Science-fiction épique':['Epickie science fiction','壮大なSF'],
'Scènes de cinéma':['Sceny filmowe','映画のワンシーン'],
'Football de club':['Piłka nożna klubowa','クラブサッカー'],
'Glaces & desserts glacés':['Lody i mrożone desery','アイスクリームと冷たいデザート'],
'Nouvel An':['Sylwester i Nowy Rok','ニューイヤー'],
'Effets spéciaux cinéma':['Filmowe efekty specjalne','映画の特殊効果'],
'Jouets géants':['Olbrzymie zabawki','巨大なおもちゃ'],
'Lieux iconiques':['Kultowe miejsca','世界のランドマーク'],
'Noël':['Boże Narodzenie','クリスマス'],
'Noël à Strasbourg':['Boże Narodzenie w Strasburgu','ストラスブールのクリスマス'],
'Portrait noir et blanc':['Portrety czarno-białe','モノクロポートレート'],
'Pâtisserie créative':['Kreatywne cukiernictwo','クリエイティブなスイーツ'],
'Gastronomie 3D':['Kulinarny świat 3D','3Dフードアート'],
'Univers polaire':['Polarne krajobrazy','極地の風景'],
'Robes & couleurs de drapeaux':['Suknie w barwach flag','国旗カラーのドレス'],
'Robes à Santorin':['Suknie na Santorini','サントリーニのドレス'],
'Scènes d’action':['Sceny akcji','アクションシーン'],
'Univers de séries':['Światy seriali','ドラマの世界'],
'Sport & mouvement':['Sport i ruch','スポーツと躍動感'],
'Essais automobiles':['Jazdy testowe','自動車の試乗シーン'],
'Festival électro fantastique':['Fantastyczny festiwal muzyki elektronicznej','幻想的なエレクトロニック・フェス'],
'Supercars':['Supersamochody','スーパーカー']
};
const copy={
'Promptya':['Promptya','Promptya'],'FLUX 3 Image':['FLUX 3 Image','FLUX 3 Image'],'Viral Trend':['Viral Trend','Viral Trend'],'Viral':['Viral','Viral'],'Trend':['Trend','Trend'],'Adult Prompt':['Portrety glamour','グラマーポートレート'],'Covers':['Okładki muzyczne','ジャケット画像'],'JSON':['JSON','JSON'],
'Promptya accueil':['Strona główna Promptya','Promptya ホーム'],
'Packs':['Pakiety','画像パック'],'Mascottes':['Postacie','キャラクター'],'Journal':['Poradniki i inspiracje','読みもの'],'Tarifs':['Cennik','料金'],'Panier':['Koszyk','カート'],'Mon compte':['Moje konto','マイアカウント'],
'Ouvrir le menu':['Otwórz menu','メニューを開く'],'Fermer le menu':['Zamknij menu','メニューを閉じる'],'Rechercher un pack…':['Szukaj pakietu…','画像パックを検索…'],'Rechercher un pack':['Szukaj pakietu','画像パックを検索'],
'Des idées infinies, des images uniques':['Nieograniczone pomysły. Niepowtarzalne obrazy.','無限のアイデアから、あなただけの画像へ。'],
'Créez vos prompts':['Twórz z wyobraźnią','アイデアを形に。'],'et générez des packs':['i generuj pakiety','AIでつくる、'],'d’images avec l’IA':['obrazów za pomocą AI','あなただけの画像コレクション。'],
'Des centaines de thèmes, un seul objectif : des images incroyables, prêtes à l’emploi. Choisissez un pack, personnalisez, générez et recevez vos 100 images.':['Mnóstwo motywów i jeden cel: wyjątkowe obrazy gotowe do użycia. Wybierz pakiet, dopasuj ustawienia i wygeneruj do 100 obrazów.','豊富なテーマから、お気に入りの世界観を見つけましょう。パックと設定を選んで、すぐに使える画像を最大100枚生成できます。'],
'Découvrir les packs':['Odkryj pakiety','画像パックを見る'],'Voir tous les packs':['Zobacz wszystkie pakiety','すべてのパックを見る'],'Toutes les collections →':['Wszystkie kolekcje →','すべてのコレクション →'],'Découvrir le pack ↗':['Zobacz pakiet ↗','パックを見る ↗'],
'1 à 100':['1–100','1〜100枚'],'images générées':['wygenerowanych obrazów','の画像を生成'],'Livraison ZIP':['Pobieranie ZIP','ZIPでダウンロード'],'haute qualité':['wysoka jakość','高画質'],'Objectif 2h':['Docelowo 2 godz.','目安：2時間'],'à confirmer':['do potwierdzenia','要確認'],'100 images':['100 obrazów','画像100枚'],'par pack':['w pakiecie','1パックあたり'],'Des centaines':['Mnóstwo','多彩な'],'de styles ↙':['stylów ↙','スタイル ↙'],
'NOS PACKS PREMIUM':['NASZE PAKIETY PREMIUM','プレミアム画像パック'],'Un pack = un onglet de votre fichier = 100 images':['Jeden pakiet, jeden motyw, do 100 obrazów.','1つのパックで、1つのテーマを最大100枚。'],
'Chaque pack correspond à une catégorie / un thème. Vous recevez 100 images générées, prêtes à l’emploi.':['Każdy pakiet ma własny motyw. Wygeneruj do 100 obrazów gotowych do użycia.','各パックに、それぞれのテーマと世界観があります。すぐに使える画像を最大100枚生成できます。'],
'GÉNÉRATEUR D’IMAGES':['GENERATOR OBRAZÓW AI','AI画像ジェネレーター'],'Créez votre pack personnalisé':['Stwórz własny pakiet obrazów','オリジナルの画像パックをつくる'],
'Importer des visages (référence)':['Dodaj zdjęcie referencyjne twarzy','顔の参考写真をアップロード'],'Glissez vos photos ici':['Przeciągnij zdjęcia tutaj','ここに写真をドラッグ'],'ou cliquez pour importer':['lub kliknij, aby je dodać','またはクリックしてアップロード'],'Nombre de photos':['Liczba obrazów','画像の枚数'],'Choisir un modèle':['Wybierz model','モデルを選ぶ'],'Générer mon pack':['Wygeneruj mój pakiet','画像パックを生成'],
'LE HASARD FAIT BIEN LES CHOSES':['DAJ SIĘ ZAINSPIROWAĆ','思いがけない出会いを。'],'Huit univers. Votre prochain déclic.':['Osiem światów. Znajdź kolejną inspirację.','8つの世界から、次のひらめきを。'],'Laissez-vous surprendre par une sélection de nos collections.':['Odkryj wybrane kolekcje i znajdź pomysł na kolejny projekt.','おすすめのコレクションから、新しいアイデアを見つけましょう。'],'Une autre sélection ↻':['Pokaż inne propozycje ↻','別のコレクションを表示 ↻'],
'LES FORFAITS PROMPTYA':['PAKIETY CENOWE PROMPTYA','PROMPTYAの料金プラン'],'De 1 à 4 packs, jusqu’à 400 photos.':['Od 1 do 4 pakietów, do 400 obrazów.','1〜4パック、最大400枚。'],'Un tarif dégressif pour des packs achetés dans la même commande.':['Im więcej pakietów w jednym zamówieniu, tym niższa cena za pakiet.','一度に購入するパック数が増えるほど、1パックあたりの料金がお得になります。'],
'Votre idée.':['Twój pomysł.','あなたのアイデアに、'],'Son plus beau cadre.':['Najlepszy kadr.','ぴったりの構図を。'],'Carré':['Kwadrat','正方形'],'Portrait':['Pion','縦長'],'Paysage':['Poziom','横長'],
'Comment ça marche':['Jak to działa','ご利用の流れ'],'Choisissez votre univers':['Wybierz swój świat','テーマを選ぶ'],'Ajoutez votre touche':['Dodaj coś od siebie','自分らしさを加える'],'Vérifiez votre sélection':['Sprawdź swój wybór','選択内容を確認する'],'Retrouvez vos créations':['Odbierz swoje obrazy','生成した画像を受け取る'],
'Ouvrir le studio':['Otwórz studio','スタジオを開く'],'Voir mon panier':['Zobacz koszyk','カートを見る'],'Mon espace de commandes':['Moje zamówienia','注文一覧'],'Voir le parcours en détail':['Zobacz wszystkie etapy','詳しい手順を見る'],
'Suivez la progression dans vos commandes et téléchargez vos images terminées en ZIP.':['Śledź postęp w zakładce zamówień i pobierz gotowe obrazy w pliku ZIP.','注文ページで進捗を確認し、完成した画像をZIP形式でダウンロードできます。'],
'Un forfait pour une commande de 1 à 100 images.':['Jedna stała cena za zamówienie od 1 do 100 obrazów.','1回の注文で1〜100枚まで、料金は一律です。'],
'Après confirmation, le personnage est retiré du catalogue. Les 30 photos sont suivies et livrées depuis votre commande.':['Po potwierdzeniu zakupu postać znika z katalogu. Postęp realizacji i wszystkie 30 obrazów znajdziesz na stronie zamówienia.','購入が確定すると、そのキャラクターはカタログから削除されます。注文ページで進捗を確認し、30枚の画像を受け取れます。'],
'Aucune collection pour cette recherche.':['Nie znaleziono kolekcji pasujących do wyszukiwania.','検索条件に一致するコレクションはありません。'],'Que contient le téléchargement ?':['Co zawiera pobierany plik?','ダウンロードには何が含まれますか？'],
'D’autres collections à découvrir.':['Odkryj inne kolekcje.','ほかのコレクションも見てみましょう。'],'POUR COMPARER LES UNIVERS':['PORÓWNAJ RÓŻNE ŚWIATY','ほかの世界観を探す'],
'Votre personnage.':['Twoja postać.','あなただけのキャラクター。'],'Un personnage.':['Jedna postać.','忘れられない存在感。'],'Rencontrer le casting ↓':['Poznaj postacie ↓','キャラクターを見る ↓'],'Un seul acquéreur par personnage':['Jedna postać, jeden nabywca','各キャラクターの購入者は1名限定'],
'Copier':['Kopiuj','コピー'],'Copié ✓':['Skopiowano ✓','コピーしました ✓'],'Pause':['Wstrzymaj','一時停止'],'Lire l’animation':['Odtwórz animację','動画を再生'],'Mettre en pause':['Wstrzymaj odtwarzanie','動画を一時停止'],
'Connexion':['Logowanie','ログイン'],'Inscription':['Rejestracja','新規登録'],'Créer un compte':['Utwórz konto','アカウントを作成'],'Se connecter':['Zaloguj się','ログイン'],'Mot de passe':['Hasło','パスワード'],'Adresse e-mail':['Adres e-mail','メールアドレス'],'Pas encore de compte ?':['Nie masz jeszcze konta?','アカウントをお持ちでない方へ'],'Mes commandes':['Moje zamówienia','注文履歴'],'Télécharger le ZIP':['Pobierz ZIP','ZIPをダウンロード'],
'Votre imagination mérite':['Twoja wyobraźnia zasługuje','あなたの想像力を、'],'plus qu’une seule image.':['na więcej niż jeden obraz.','1枚だけで終わらせない。'],'UNE IDÉE. TOUTE UNE SÉRIE.':['JEDEN POMYSŁ. CAŁA SERIA.','ひとつのアイデアから、ひとつのコレクションへ。'],'Trouver mon pack':['Znajdź mój pakiet','自分に合うパックを探す'],'Retour en haut ↑':['Wróć na górę ↑','ページの先頭へ ↑'],
'Créer avec Promptya':['Twórz z Promptya','Promptyaでつくる'],'Explorer les univers':['Odkrywaj kolekcje','テーマを探す'],'Nos collections':['Nasze kolekcje','コレクション'],'Comprendre & préparer':['Porady i przygotowanie','使い方と準備'],'Votre espace':['Twoje konto','アカウント'],'Tous les packs':['Wszystkie pakiety','すべての画像パック'],'Le studio':['Studio','画像生成スタジオ'],'Mascottes exclusives':['Postacie na wyłączność','限定キャラクター'],'Covers d’album':['Okładki albumów','アルバムジャケット'],'Galerie d’inspiration':['Galeria inspiracji','インスピレーションギャラリー'],'Voyage & destinations':['Podróże i miejsca','旅と世界の街'],'Mode & portraits':['Moda i portrety','ファッションとポートレート'],'Création & cinéma':['Kreacja i kino','クリエイティブと映画'],'Sport':['Sport','スポーツ'],'Gourmandise':['Słodkie inspiracje','グルメ'],'Tarifs des packs':['Ceny pakietów','パック料金'],'Guides & questions':['Poradniki i pytania','ガイドとよくある質問'],'Le journal':['Poradniki i inspiracje','読みもの'],'Choisir son format':['Wybierz format','画像サイズの選び方'],'Connexion & inscription':['Logowanie i rejestracja','ログイン・新規登録'],'Mon panier':['Mój koszyk','カート'],'Photos IA personnalisées':['Obrazy AI na zamówienie','パーソナライズAI画像'],'Créer des miniatures 3D':['Twórz miniaturowe światy 3D','3Dミニチュアをつくる']
};
export function reviewedAdditionalCopy(locale,dictionary){
 const i=locale==='pl'?0:1,result={};
 for(const [source,values] of Object.entries({...names,...copy}))result[source]=values[i];
 const tr=s=>result[s]||dictionary[s]||s;
 for(const e of Object.values(editorial)){
  const n=tr(e.name),[a,b]=e.scenes.slice(0,2).map(x=>tr(x.title));
  const values=locale==='pl'?[
   `Ile kosztuje kolekcja „${n}”?`,`Jak spersonalizować obrazy z kolekcji „${n}”?`,`Co oferuje pakiet „${n}”?`,`Stwórz mój pakiet „${n}” →`,`${n}: spersonalizowane obrazy AI | Promptya`,`Stwórz serię obrazów AI z motywem „${n}”.`,`Cztery przykłady z pakietu „${n}”.`,`Odkryj motyw „${n}”: ${a}, ${b}. Wygeneruj od 1 do 100 obrazów AI za 22,90 €, z opcjonalnym zgodnym zdjęciem referencyjnym i pobieraniem ZIP.`
  ]:[
   `「${n}」コレクションの料金はいくらですか？`,`「${n}」の画像を自分好みにできますか？`,`「${n}」はどのような画像パックですか？`,`「${n}」パックをつくる →`,`${n}｜パーソナライズAI画像 | Promptya`,`「${n}」をテーマに、AI画像のコレクションをつくる。`,`「${n}」パックの作例4点。`,`${n}の世界をAI画像に。${a}、${b}などのシーンで1〜100枚を生成。料金は22.90ユーロ。対応する参考写真を追加でき、完成した画像はZIPでダウンロードできます。`
  ];
  const sources=[`Combien coûte la collection ${e.name} ?`,`Comment personnaliser mes images ${e.name} ?`,`Quel univers propose le pack ${e.name} ?`,`Créer mon pack ${e.name} →`,`Pack ${e.name} : images IA personnalisées | Promptya`,`Créer une série IA dans l’univers ${e.name}.`,`Quatre exemples du pack ${e.name}.`,`${e.name} en images IA : ${e.scenes.slice(0,2).map(s=>s.title).join(', ')}. Créez de 1 à 100 images à 22,90 €, avec référence compatible et ZIP.`];
  sources.forEach((source,k)=>result[source]=values[k]);
 }
 return result;
}
