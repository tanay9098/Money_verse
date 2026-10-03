import type { Difficulty, Lesson, LessonIllustration, QuizQuestion } from "@/lib/types";

/**
 * The eight starter lessons. Every amount is a fictional game coin.
 * They are the demo lessons in local development and the source for `npm run seed:sanity`.
 * Production never shows them unless they are approved and published in Sanity.
 */

type Opt = [id: string, label: string, correct: boolean, explanation: string];

function question(id: string, prompt: string, options: Opt[]): QuizQuestion {
  return {
    id,
    prompt,
    choices: options.map(([choiceId, label, correct, explanation]) => ({ id: choiceId, label, correct, explanation })),
  };
}

function section(id: string, heading: string, body: string, illustration: LessonIllustration) {
  return { id, heading, body, illustration };
}

function lesson(
  order: number,
  slug: string,
  title: string,
  topic: string,
  difficulty: Difficulty,
  summary: string,
  body: string,
  objectives: string[],
  sections: Lesson["sections"],
  quiz: QuizQuestion[],
  rewards: { coins: number; xp: number },
): Lesson {
  return {
    id: slug,
    slug,
    title,
    summary,
    body,
    topic,
    difficulty,
    objectives,
    ageMin: 8,
    ageMax: 12,
    order,
    sections,
    quiz,
    passPercent: 66,
    rewards,
  };
}

export const starterLessons: Lesson[] = [
  lesson(
    1,
    "income-and-earning",
    "Where money comes from",
    "Income and earning",
    "easy",
    "Income is money that comes in. Earning means you did something useful for it.",
    "Pip wants a new kite. Pip cannot just wish coins into the wallet. In the town, coins come in when someone does a job, sells something, or receives a gift. Money that comes in is called income.",
    ["Explain what income is.", "Tell earned income apart from a gift."],
    [
      section("earn", "Earning", "Pip waters the neighbor's plants and gets 6 game coins. That is earned income: Pip did work and got paid for it.", "coin"),
      section("gift", "Gifts and allowances", "Sometimes coins arrive without a job, like a birthday gift. That is still income, but it is not earned. Earned and gifted coins both go in the wallet.", "jar"),
      section("choice", "Why it matters", "Income is only half of the story. What you do next, spend or save, decides what is left. The next lessons practice that.", "balance"),
    ],
    [
      question("income-q1", "Pip walks a neighbor's dog and receives 5 game coins. What is that money?", [
        ["earned", "Earned income, because Pip did a job", true, "Yes. Work in exchange for coins is earned income."],
        ["debt", "Debt Pip must pay back", false, "Debt is borrowed money. Pay for work is not borrowed."],
        ["cost", "A cost Pip has to pay", false, "A cost is money going out. This coin is coming in."],
      ]),
      question("income-q2", "Which one is income?", [
        ["gift", "A 10 game coin birthday gift", true, "Coins that come in count as income, even when they are a gift."],
        ["bus", "Paying 4 game coins for the bus", false, "That is spending. It is money going out."],
        ["lent", "Giving a friend 3 coins to hold", false, "Handing coins away is not money coming in."],
      ]),
      question("income-q3", "Pip earns 8 game coins and spends 3. How many coins are left?", [
        ["five", "5 game coins", true, "8 coins in, 3 coins out. 8 − 3 = 5."],
        ["eleven", "11 game coins", false, "Adding would mean Pip received more. Spending takes coins away."],
        ["three", "3 game coins", false, "3 is what Pip spent. Subtract it from 8 to see what is left."],
      ]),
    ],
    { coins: 6, xp: 20 },
  ),
  lesson(
    2,
    "needs-and-wants",
    "Needs and wants",
    "Needs vs wants",
    "easy",
    "A need keeps you safe, healthy, or ready to learn. A want is a nice extra.",
    "Not every thing you like is a thing you need. Telling the two apart is one of the strongest money skills there is, and wants are allowed. You only have to notice which is which before you spend.",
    ["Sort items into needs and wants.", "Explain why a want can wait."],
    [
      section("need", "Needs", "Food, water, a warm coat in winter, a way to get to school, and school supplies are needs. Without them, staying healthy or learning gets hard.", "cart"),
      section("want", "Wants", "Toys, stickers, fancy snacks, and a third pair of cool shoes are wants. They are fun. Life still works if they wait.", "lightbulb"),
      section("grey", "Sometimes it is both", "A coat is a need. A coat with sparkles is partly a want. A good question is: what is the plainest way to cover the need? Then decide if the extra is worth its cost.", "balance"),
    ],
    [
      question("nw-q1", "Which one is a need?", [
        ["lunch", "Lunch when you are hungry", true, "Food keeps your body going. That makes it a need."],
        ["stickers", "A pack of glitter stickers", false, "Stickers are fun, so they are a want."],
        ["toy", "A new toy", false, "A toy is a want. It is fine to buy one on purpose."],
      ]),
      question("nw-q2", "Pip has 10 game coins. Rain is coming and Pip has no coat. What is the smartest first move?", [
        ["coat", "Cover the coat need first, then see what is left", true, "Needs come first. Then leftover coins can go to wants or savings."],
        ["toy", "Buy the toy, then worry about the coat", false, "If coins run out, the need is not covered. That is the trap."],
        ["nothing", "Do nothing and hope", false, "Hoping is not a plan. A plan decides what to cover first."],
      ]),
      question("nw-q3", "A want is…", [
        ["extra", "Something nice to have that you can live without", true, "Right. Wants are allowed, they just come after needs."],
        ["bad", "Always a bad choice", false, "Wants are not bad. They just need a plan."],
        ["required", "Something you must have to stay healthy", false, "That describes a need."],
      ]),
    ],
    { coins: 6, xp: 20 },
  ),
  lesson(
    3,
    "spending-and-opportunity-cost",
    "Choosing and giving something up",
    "Spending and opportunity cost",
    "medium",
    "Every choice has a trade-off. The thing you give up is the opportunity cost.",
    "You can spend a coin only once. When Pip chooses cookies, those same coins cannot also buy a bus ride. The best thing Pip gave up has a name: opportunity cost.",
    ["Explain opportunity cost in your own words.", "Name the trade-off in a spending choice."],
    [
      section("once", "A coin has one job", "Pip has 12 game coins. Cookies cost 8. A bus ride costs 5. Pip cannot afford both. Picking one means letting the other go.", "coin"),
      section("cost", "The thing you give up", "If Pip picks cookies, the opportunity cost is the bus ride. If Pip picks the bus, it is the cookies. Opportunity cost is not a mistake. It is just the other road.", "balance"),
      section("deliberate", "Choose on purpose", "Before spending, ask: what else could these coins do? Naming the trade-off turns a quick grab into a real decision.", "lightbulb"),
    ],
    [
      question("oc-q1", "Pip has 12 game coins and spends 8 on cookies. What is the opportunity cost?", [
        ["bus", "The bus ride Pip can no longer afford", true, "The best thing given up is the opportunity cost."],
        ["cookies", "The cookies themselves", false, "The cookies are what Pip got. The opportunity cost is what Pip gave up."],
        ["none", "There is no cost, cookies are yummy", false, "Every spend gives something up, even when the choice is a good one."],
      ]),
      question("oc-q2", "Which choice shows someone thinking about opportunity cost?", [
        ["think", "“If I buy this, what else could these coins do?”", true, "Asking what else the coins could do names the trade-off."],
        ["grab", "“I will just grab it before I forget.”", false, "Grabbing fast skips the thinking."],
        ["copy", "“I will buy what my friend buys.”", false, "Copying a friend does not weigh your own trade-offs."],
      ]),
      question("oc-q3", "Is opportunity cost always bad?", [
        ["no", "No. It is just what you give up, and a good choice can still have one", true, "A smart choice still gives something up. Naming it is the skill."],
        ["yes", "Yes. It means you made a mistake", false, "It does not mean a mistake. It means every choice has a trade-off."],
        ["rich", "It only matters if you are rich", false, "It matters for anyone who cannot buy everything at once."],
      ]),
    ],
    { coins: 8, xp: 25 },
  ),
  lesson(
    4,
    "budgeting-limited-money",
    "Making a budget",
    "Budgeting",
    "medium",
    "A budget is a plan for your coins before you spend them.",
    "A budget tells each coin where to go. Pip has 20 game coins for a market day. Without a plan the coins vanish on the first stall. With a plan, Pip covers needs, saves some, and still has room for one treat.",
    ["Split a small amount into needs, savings, and wants.", "Check that a plan adds up."],
    [
      section("split", "Three jobs for coins", "Pip's plan for 20 game coins: 8 for needs, 6 for saving, 6 for a treat. 8 + 6 + 6 = 20, so the plan adds up.", "jar"),
      section("add", "Always check the total", "A budget that spends 24 coins when Pip only has 20 is not a budget. It is a wish. Add up the parts and compare them with the coins you really have.", "calendar"),
      section("adjust", "Plans can change", "If the bus costs more than planned, Pip trims the treat first, not the needs. A budget is a tool for choosing, not a rulebook that cannot bend.", "balance"),
    ],
    [
      question("bg-q1", "Pip has 20 game coins. The plan is 8 needs, 6 savings, and 6 treat. Does it work?", [
        ["yes", "Yes. 8 + 6 + 6 is exactly 20", true, "The parts add up to the coins Pip has."],
        ["no", "No. It is too much", false, "Add it: 8 + 6 + 6 = 20. That is exactly Pip's amount."],
        ["short", "No. It leaves 5 coins too few", false, "Check the sum again. The plan uses exactly 20."],
      ]),
      question("bg-q2", "Pip has 15 coins and plans to spend 9 on needs, 5 on a toy, and 4 on saving. What is wrong?", [
        ["over", "The plan spends 18 coins, which is more than 15", true, "9 + 5 + 4 = 18. Pip would be 3 coins short. Trim the toy."],
        ["fine", "Nothing, it is a good plan", false, "9 + 5 + 4 is 18, but Pip only has 15."],
        ["save", "Saving is never allowed in a budget", false, "Saving belongs in a budget. The problem is the total."],
      ]),
      question("bg-q3", "A surprise cost shows up. Which part of the budget should shrink first?", [
        ["treat", "The treat or want", true, "Wants are the easiest to trim. Needs come first."],
        ["need", "A need like lunch", false, "Needs should be protected."],
        ["both", "Nothing. Just spend more than planned", false, "Spending more than you have breaks the budget."],
      ]),
    ],
    { coins: 8, xp: 25 },
  ),
  lesson(
    5,
    "saving-for-a-goal",
    "Saving for a goal",
    "Saving",
    "easy",
    "A goal gives your savings a name and a number to aim for.",
    "Pip wants a town bicycle that costs 150 game coins. That is a savings goal. Pip will not have 150 coins on day one, and that is fine. Saving is putting a little aside again and again.",
    ["Tell the difference between a goal, a wallet, and savings.", "Work out how much is left to save."],
    [
      section("goal", "The goal is a target", "The goal, 150 game coins, is the number to reach. It is not coins Pip already has.", "jar"),
      section("wallet", "Wallet and savings jar", "The wallet holds coins Pip can use today. The savings jar holds coins set aside for the goal. Moving coins from wallet to jar lowers the wallet and raises the jar.", "coin"),
      section("left", "How much is left?", "Pip has 40 coins in the jar and the goal is 150. 150 − 40 = 110 coins still to save. Each time Pip earns coins, some can go in the jar.", "calendar"),
    ],
    [
      question("sv-q1", "The bicycle costs 150 game coins and Pip has saved 40. How many are still to save?", [
        ["110", "110 game coins", true, "150 − 40 = 110."],
        ["190", "190 game coins", false, "That adds the numbers. Subtract what is saved from the goal."],
        ["40", "40 game coins", false, "40 is what is already saved."],
      ]),
      question("sv-q2", "What happens to the wallet when Pip moves 10 coins into the savings jar?", [
        ["down", "The wallet goes down by 10 and the jar goes up by 10", true, "Coins move from one place to the other. None are lost."],
        ["same", "Both stay the same", false, "Moving coins changes both places."],
        ["both", "Both go up by 10", false, "Coins cannot be copied. They move."],
      ]),
      question("sv-q3", "Which is the best way to reach a big goal?", [
        ["often", "Put a little aside each time coins come in", true, "Small steady saving adds up."],
        ["wait", "Wait until you have the whole amount at once", false, "Waiting for everything at once usually means never starting."],
        ["spend", "Spend first and save only what is left", false, "Saving first, even a bit, makes a goal more likely."],
      ]),
    ],
    { coins: 6, xp: 20 },
  ),
  lesson(
    6,
    "profit-and-simple-business",
    "Revenue, costs, and profit",
    "Profit and business",
    "hard",
    "Profit is what is left after costs are paid.",
    "Pip opens a lemonade stand. Customers hand over coins, but Pip also had to buy lemons, sugar, and cups. Whether the stand did well depends on both sides.",
    ["Use revenue, expenses, and profit correctly.", "Check whether a simple stand plan makes money."],
    [
      section("revenue", "Revenue", "Revenue is all the coins customers pay. Pip sells 10 cups at 2 game coins. Revenue = 10 × 2 = 20 coins.", "lemonade"),
      section("expenses", "Expenses", "Expenses are what Pip paid to run the stand. Supplies cost 12 coins. That is the expense.", "cart"),
      section("profit", "Profit", "Profit = revenue − expenses. 20 − 12 = 8 coins of profit. If the answer is below zero, it is a loss, and the plan cost more than it earned. A higher price or more cups can change the answer.", "balance"),
    ],
    [
      question("pf-q1", "Pip sells 10 cups at 2 game coins each. What is the revenue?", [
        ["20", "20 game coins", true, "10 × 2 = 20."],
        ["12", "12 game coins", false, "12 is the cost of supplies, not what customers paid."],
        ["8", "8 game coins", false, "8 is the profit in the example, not the revenue."],
      ]),
      question("pf-q2", "Revenue is 20 game coins and expenses are 12. What is the profit?", [
        ["8", "8 game coins", true, "20 − 12 = 8."],
        ["32", "32 game coins", false, "Profit is revenue minus expenses, not plus."],
        ["20", "20 game coins", false, "That is the revenue. Subtract the costs first."],
      ]),
      question("pf-q3", "A stand earns 9 coins but spent 14. What is that called?", [
        ["loss", "A loss of 5 coins", true, "9 − 14 = −5. Costs were bigger than what came in."],
        ["profit", "A profit of 5 coins", false, "Profit means a positive number. Here costs were larger."],
        ["even", "Breaking even", false, "Breaking even is when revenue equals expenses."],
      ]),
    ],
    { coins: 10, xp: 30 },
  ),
  lesson(
    7,
    "planning-for-surprises",
    "Planning for surprises",
    "Unexpected expenses",
    "medium",
    "A small safety jar helps when something unexpected costs coins.",
    "A bike tire pops. A toy breaks. A school trip needs a few extra coins. Surprises happen to everyone, and they are easier when a few coins are already set aside.",
    ["Explain what an emergency fund is.", "Decide how to cover a surprise cost."],
    [
      section("surprise", "Surprises are normal", "Pip's bike tire goes flat and the repair costs 7 game coins. Pip did not plan for it, but Pip can still handle it.", "umbrella"),
      section("jar", "A safety jar", "Pip keeps a small jar for surprises. When the repair comes up, Pip pays from that jar instead of cancelling the savings goal.", "jar"),
      section("refill", "Refill it", "After using the safety jar, Pip puts a few coins back in when more come in. Then the jar is ready for the next surprise.", "coin"),
    ],
    [
      question("sp-q1", "Pip's tire needs a 7 game coin repair. Pip has 9 coins in a safety jar. What is the best move?", [
        ["jar", "Pay from the safety jar", true, "That is exactly what a safety jar is for. 9 − 7 leaves 2."],
        ["goal", "Take it from the bicycle goal money", false, "That would slow the goal. The safety jar is for surprises."],
        ["skip", "Ignore the flat tire", false, "Ignoring a problem usually makes it more expensive later."],
      ]),
      question("sp-q2", "Which one is an unexpected expense?", [
        ["flat", "A flat bike tire", true, "You did not plan for it, so it is unexpected."],
        ["lunch", "Your planned lunch", false, "A planned meal is a normal part of a budget."],
        ["save", "Your weekly savings", false, "Savings are planned."],
      ]),
      question("sp-q3", "After using the safety jar, what should Pip do next?", [
        ["refill", "Put some coins back when new coins come in", true, "Refilling keeps the safety jar ready."],
        ["stop", "Never keep one again", false, "Surprises will happen again, so the jar is still useful."],
        ["spend", "Spend whatever is left on wants", false, "The leftover coins can help refill the jar first."],
      ]),
    ],
    { coins: 8, xp: 25 },
  ),
  lesson(
    8,
    "thoughtful-money-choices",
    "Thoughtful money choices",
    "Making thoughtful choices",
    "hard",
    "Pause, compare, choose, and look back. That is how good money choices are made.",
    "No one gets every money choice right. Thoughtful choosers follow a short routine, so even a wrong turn teaches something. This lesson brings together everything from the town.",
    ["Use a short routine before spending.", "Learn from a choice that did not go as planned."],
    [
      section("pause", "1. Pause", "Wait a moment before spending. A quick pause stops the I-must-have-it-now feeling from deciding for you.", "lightbulb"),
      section("compare", "2. Compare", "Is it a need or a want? What is the opportunity cost? Does it fit the budget and the savings goal?", "balance"),
      section("review", "3. Choose and look back", "After you choose, check how it went. If you regret a spend, that is information for next time, not a reason to feel bad.", "calendar"),
    ],
    [
      question("tc-q1", "Pip sees a 9 game coin toy and feels like buying it right now. What is a thoughtful first step?", [
        ["pause", "Pause, then check the budget and the goal", true, "A pause lets Pip compare before spending."],
        ["buy", "Buy it, shopping is quick", false, "Buying instantly skips the thinking steps."],
        ["hide", "Hide the wallet forever", false, "Hiding is not a plan. Pausing and comparing is."],
      ]),
      question("tc-q2", "Pip bought a want and now has too few coins for lunch. What is the useful lesson?", [
        ["next", "Cover needs first next time", true, "That turns a regret into a better plan."],
        ["never", "Never buy wants again", false, "Wants are allowed. They just come after needs."],
        ["blame", "Blame the shop", false, "Blaming does not help the next choice."],
      ]),
      question("tc-q3", "Which question fits a thoughtful money choice?", [
        ["what", "“What is this for, and what do I give up to get it?”", true, "That asks about purpose and opportunity cost."],
        ["cool", "“Is everyone else buying it?”", false, "What others buy does not tell you what fits your plan."],
        ["cheap", "“Is it the cheapest thing in the shop?”", false, "Cheap things can still be poor choices if you do not need them."],
      ]),
    ],
    { coins: 10, xp: 30 },
  ),
];
