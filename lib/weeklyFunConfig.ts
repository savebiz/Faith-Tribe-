export interface WeeklyFunItem {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'reading' | 'writing' | 'painting';
  thumbnailUrl: string;
  duration?: string;          // video only, e.g. "5:24"
  youtubeVideoId?: string;    // video only — just the ID (e.g. "dQw4w9WgXcQ"),
                              // never a full youtube.com link the child could tap into
  storyContent?: string;      // reading — the actual story text/markdown, rendered in-app
  writingPrompt?: string;     // writing — the prompt shown above the writing box
  coloringImageUrl?: string;  // painting — a line-art outline image to color within
}

export const WEEKLY_FUN_ITEMS: WeeklyFunItem[] = [
  {
    id: 'kids-1',
    title: 'Meet Your New Best Friend',
    description: 'Who is Jesus and why does He love you so much? Watch this cute cartoon video to learn more!',
    type: 'video',
    thumbnailUrl: 'https://picsum.photos/seed/jesuslove/400/250',
    duration: '5:24',
    youtubeVideoId: 'qH5HIPl0hRo' // Rickroll as a placeholder or any child-friendly placeholder ID
  },
  {
    id: 'kids-2',
    title: 'David and Goliath: Tiny Courage',
    description: 'Learn how David faced the giant with God\'s help! Read the interactive story inside.',
    type: 'reading',
    thumbnailUrl: 'https://picsum.photos/seed/david/400/250',
    storyContent: `# David and Goliath: Tiny Courage

A long, long time ago, in a beautiful green land, there lived a young boy named David. David was a shepherd. His job was to take care of his father's sheep. Every day, he walked with them, watched them eat sweet grass, and kept them safe.

David was not big. He was not strong. But David had something very special: **he trusted God with all his heart.**

---

## The Big Giant

One day, David went to visit his older brothers who were soldiers. There, he saw a giant named Goliath. Goliath was very, very tall. He wore heavy armor and had a huge spear. 

Every morning and every evening, Goliath came out and yelled at the soldiers. He made them feel very scared. None of the soldiers wanted to fight him.

But David said, *"Do not be afraid! I will go and fight the giant."*

The king looked at David and said, *"You are just a boy, and he is a giant!"*

David smiled and replied, *"God helped me save my sheep from lions and bears. He will help me now too!"*

---

## Five Smooth Stones

Instead of heavy armor, David took his shepherd's staff. He went to a bubbling brook and chose **five smooth stones**. He put them in his pouch, took his sling, and walked toward the giant.

When Goliath saw David, he laughed. *"Am I a dog that you come at me with sticks?"* he boomed.

David stood tall. *"You come with a sword and spear, but I come to you in the name of the Lord!"*

---

## The Victory

David reached into his bag, took out a stone, and put it in his sling. He swung it around and around, then let it fly!

*Swoosh!* 

The stone sailed through the air and hit Goliath right on his forehead. The giant stopped laughing. He wobbled, he shook, and then—

*THUD!*

The giant fell flat on the ground. The battle was won, not by strength, but by trust in God!

---

### What We Learned:
1. **No giant is too big** when God is on our side.
2. **You are never too small** to do great things for God.
3. **Trust God** always, just like David did!`
  },
  {
    id: 'kids-3',
    title: 'Writing Activity: A Note to Jesus',
    description: 'Type a special letter or thank-you note to Jesus. Share what you are thankful for today!',
    type: 'writing',
    thumbnailUrl: 'https://picsum.photos/seed/writing/400/250',
    writingPrompt: 'Write a thank-you note to Jesus. Tell Him what you are thankful for today, or write a prayer!'
  },
  {
    id: 'kids-4',
    title: 'Coloring Activity: The Cross of Grace',
    description: 'Use our paint tools to color the cross outline! Draw, paint, and create your own artwork.',
    type: 'painting',
    thumbnailUrl: 'https://picsum.photos/seed/cross/400/250',
    coloringImageUrl: 'https://images.unsplash.com/photo-1601247076559-459b7325606d?w=400&q=80' // A cross placeholder or fallback path
  }
];
