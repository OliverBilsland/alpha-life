/* ==================== THE ACCOUNTING TUTOR ====================
   A second income earned by LEARNING rather than trading.

   Four rules this file is built around:

   1. The explanation is the product. Every answer -- right or wrong -- gets the
      concept in plain English, why the answer is what it is, and how it shows up
      on a company card. Never "incorrect, next question".
   2. Pay for engagement, not for correctness. Working through the explanation
      and answering the follow-up is what earns the fee; being right adds a
      bonus. You cannot skip the teaching and still be paid.
   3. Repeats decay hard. Answering the same question again pays a fraction, so
      an answer key is worth almost nothing. There is also a monthly ceiling.
   4. Every question is about accounting the trading game actually uses -- the
      five numbers on the cards and the line items behind them.

   It starts from "what is revenue" and builds to "why is a cheap multiple
   sometimes a warning", for someone who has never taken a finance class. */

const TUTOR_LEVELS=[
 {n:'Foundations',  d:'What the words mean. Revenue, costs, profit.'},
 {n:'Margins',      d:'What is left over, and what that tells you about a business.'},
 {n:'The balance sheet', d:'Debt, and who really decides what happens in a bad year.'},
 {n:'Cash',         d:'Why profit and cash are not the same thing.'},
 {n:'Valuation',    d:'What you are paying, and whether cheap is really cheap.'}
];

const QUESTIONS=[
/* ---------- 1. Foundations: what the words mean ---------- */
{id:'q-rev', lvl:1, t:'Revenue',
 q:'A bakery sells $500,000 of bread in a year. Ingredients, staff and rent cost $430,000. What is its revenue?',
 opts:['$500,000 — everything customers paid','$70,000 — what is left over','$430,000 — what it spent','You cannot tell'], a:0,
 why:'Revenue is everything customers paid you, before a single cost is taken off. So it is the $500,000. The $70,000 left after costs is profit, which is a completely different number.',
 card:'On a company card, <strong>revenue growth</strong> is how fast this top number is rising. It tells you the business is winning more customers — and nothing yet about whether that is profitable.',
 check:{q:'Revenue is:', opts:['Everything customers paid, before costs','What is left after costs'], a:0}},

{id:'q-topline', lvl:1, t:'The top line',
 q:'People call revenue "the top line". Why?',
 opts:['It sits at the top of the accounts, before costs are subtracted','It is the biggest company in the market','It is the top price charged','It is last year\u2019s number'], a:0,
 why:'Company accounts start with revenue and subtract costs going down the page, arriving at profit at the bottom. Hence "top line" for sales and "bottom line" for profit. It is just a description of where the numbers sit.',
 card:'The card gives you the top line as growth, and the bottom line as margin. Everything else explains the distance between them.',
 check:{q:'The bottom line is:', opts:['Profit','Revenue'], a:0}},

{id:'q-unit', lvl:1, t:'Where revenue comes from',
 q:'A cafe sells 200 coffees a day at $4 each. What is its daily revenue?',
 opts:['$800','$204','$50','$4'], a:0,
 why:'Revenue is simply price times volume: 200 x $4 = $800. That is worth remembering, because a company can grow revenue two very different ways — selling more, or charging more — and they are not equally impressive.',
 card:'When a card shows high revenue growth, the useful follow-up is which of the two it was. Growth from raising prices usually means the brand is strong; growth from selling more usually means the market is.',
 check:{q:'Revenue is:', opts:['Price multiplied by how many you sold','Price minus cost'], a:0}},

{id:'q-cost', lvl:1, t:'Costs',
 q:'Which of these is a cost of running the bakery?',
 opts:['Flour, wages and rent','The money customers hand over','The number of loaves sold','The name above the door'], a:0,
 why:'Costs are what the business spends to make and sell what it sells. Flour, wages and rent are all costs. Nothing a customer pays you is a cost — that is revenue arriving.',
 card:'Costs never appear on a card directly. They appear as their result: the <strong>operating margin</strong>, which is whatever survives after all of them.',
 check:{q:'Wages are:', opts:['A cost','Revenue'], a:0}},

{id:'q-profit', lvl:1, t:'Profit',
 q:'Revenue is $500,000 and total costs are $430,000. What is the profit?',
 opts:['$70,000','$930,000','$500,000','$430,000'], a:0,
 why:'Profit is revenue minus costs: $500,000 less $430,000 is $70,000. It is the point of the whole exercise, and in almost every real business it is a much smaller number than revenue.',
 card:'This is why two companies with identical revenue can be completely different investments. The card shows both: growth for size, margin for what actually survives.',
 check:{q:'Profit is:', opts:['Revenue minus costs','Revenue plus costs'], a:0}},

{id:'q-loss', lvl:1, t:'A loss',
 q:'A company has revenue of $200,000 and costs of $260,000. What has it made?',
 opts:['A loss of $60,000','A profit of $60,000','A profit of $460,000','Nothing at all'], a:0,
 why:'When costs are larger than revenue, the difference is a loss — here $60,000. Losses are not automatically fatal; young companies often lose money deliberately while building something. They become fatal when the cash to fund them runs out.',
 card:'A card will rarely show you an outright loss, but it will show a very thin margin, which is the same warning at an earlier stage.',
 check:{q:'A loss happens when:', opts:['Costs are bigger than revenue','Revenue is bigger than costs'], a:0}},

{id:'q-margin1', lvl:1, t:'What a margin is',
 q:'The bakery makes $70,000 of profit on $500,000 of revenue. What is its margin?',
 opts:['14%','70%','7 times','$430,000'], a:0,
 why:'A margin is profit shown as a share of revenue: 70,000 divided by 500,000 is 14%. It means 14 cents of every dollar over the counter survives as profit. Turning it into a percentage is what lets you compare a bakery with a bank.',
 card:'<strong>Operating margin</strong> on a card is exactly this calculation, already done for you.',
 check:{q:'A margin turns profit into:', opts:['A share of revenue, so you can compare','A total in dollars'], a:0}},

{id:'q-bigger', lvl:1, t:'Bigger is not better',
 q:'Company A has revenue of $50m and profit of $1m. Company B has revenue of $10m and profit of $3m. Which keeps more of what it sells?',
 opts:['B — it keeps 30 cents in the dollar against A\u2019s 2','A — it is five times the size','They are the same','You cannot compare them'], a:0,
 why:'A keeps 2% of what it sells; B keeps 30%. B is the far better business at what it does, even though A is five times larger. Size and quality are separate questions, and beginners almost always look at size first.',
 card:'This is why the card never shows you revenue in dollars — only its growth rate and its margin. The absolute size would just distract you.',
 check:{q:'A bigger company is:', opts:['Not necessarily a better one','Always a better one'], a:0}},

/* ---------- 2. Margins: what is left, and what it tells you ---------- */
{id:'q-margin2', lvl:2, t:'Reading a margin',
 q:'A company has a 30% operating margin. What does that tell you?',
 opts:['It keeps 30 cents of every dollar of sales as profit','It grew 30% this year','It has 30% of the market','Its shares rose 30%'], a:0,
 why:'A 30% margin means 30 cents in every sales dollar survives as operating profit. High margins usually mean customers will pay up and rivals cannot easily undercut — that is pricing power. It is a statement about strength, not size.',
 card:'When a card shows two companies in one industry with very different margins, that gap is rarely down to management skill. It is usually one of them having something the other does not: a brand, a network, a licence.',
 check:{q:'A high margin usually signals:', opts:['Pricing power','A bigger company'], a:0}},

{id:'q-margin4', lvl:2, t:'Where margins come from',
 q:'A supermarket runs a 3% margin and a software company runs a 35% margin. What explains it?',
 opts:['Selling one more copy of software costs almost nothing','Supermarkets are badly run','Software sells more units','Supermarkets pay more tax'], a:0,
 why:'It is the shape of the business, not the skill of the managers. One more copy of software costs almost nothing to deliver, so nearly all of that sale is profit. One more loaf means buying more flour. Thin-margin businesses are not badly run — they are structurally thin.',
 card:'This is why a margin is only meaningful against companies in the same industry, and why the game always pairs two companies from one sector.',
 check:{q:'Margins should be compared:', opts:['Within the same industry','Between any two companies'], a:0}},

{id:'q-grossop', lvl:2, t:'Two kinds of margin',
 q:'Gross margin is what is left after making the product. Operating margin is what is left after that AND all the other running costs. Which is always smaller?',
 opts:['Operating margin','Gross margin','They are always equal','It varies'], a:0,
 why:'Operating margin comes after more has been subtracted, so it is always the smaller of the two. Gross margin tells you whether the product itself is profitable; operating margin tells you whether the whole company is.',
 card:'The card shows operating margin, the tougher of the two tests, because a company can make a lovely product and still lose money running itself.',
 check:{q:'Operating margin is:', opts:['After more costs, so smaller','Before costs, so larger'], a:0}},

{id:'q-margin5', lvl:2, t:'Revenue up, margin down',
 q:'A retailer grows revenue 20% but its margin falls from 12% to 7%. What is the most likely explanation?',
 opts:['It bought the growth by cutting prices or spending heavily to get it','It became more efficient','Its customers got richer','It paid off debt'], a:0,
 why:'Growth is easy to buy — discount hard enough and volumes will rise. If revenue climbs while margin falls, you are usually watching a company purchase its growth rather than earn it. Sometimes that is a deliberate land-grab; often it is a business losing its pricing power.',
 card:'On a card this looks like strong growth beside a thin margin. It is one of the most common traps, because the growth number is the one that catches your eye first.',
 check:{q:'Growth with a falling margin usually means:', opts:['The growth was bought, not earned','The company got more efficient'], a:0}},

{id:'q-growth1', lvl:2, t:'What growth tells you',
 q:'A company grows revenue 25% a year for five years. What does that most reliably tell you?',
 opts:['It is winning more customers or charging more','Its shares will rise','It is profitable','It has no debt'], a:0,
 why:'Growth tells you people are buying more of what it sells. It says nothing at all about whether that is profitable, safe or fairly priced — which is precisely why the card gives you four other numbers.',
 card:'Growth is the number beginners over-weight most. It is genuinely important, and it is one of five.',
 check:{q:'Fast growth proves:', opts:['Demand, and nothing else','That the company is a good investment'], a:0}},

{id:'q-growth2', lvl:2, t:'Growth without profit',
 q:'A delivery company grows 40% a year on a 2% margin. What is the key question?',
 opts:['Does the margin improve as it gets bigger?','How many drivers does it have?','Is the founder well known?','What colour are the vans?'], a:0,
 why:'Thin margins are survivable if scale fixes them — costs spread over more sales. They are fatal if they do not, because you are simply doing more and more work for almost nothing. Whether scale fixes the margin is the entire investment case.',
 card:'You cannot see the future margin on a card. What you can see is whether the current one is thin enough that it has to improve.',
 check:{q:'For a fast-growing, thin-margin company, the key question is:', opts:['Whether scale improves the margin','How fast it is growing'], a:0}},

{id:'q-scale', lvl:2, t:'Why size can help margins',
 q:'A software firm\u2019s costs are mostly fixed. If revenue doubles, what usually happens to its margin?',
 opts:['It rises, because the same costs are spread over more sales','It falls by half','It stays exactly the same','It becomes negative'], a:0,
 why:'Fixed costs do not rise with sales. If the office, the engineers and the servers cost the same whether you sell 1,000 or 2,000 licences, then doubling revenue drops most of the extra straight to profit. This is why some businesses get dramatically better as they grow.',
 card:'It is the reason a currently-thin margin on a fast grower is sometimes a bargain and sometimes a trap. The question is always whether the costs are fixed or rise with every sale.',
 check:{q:'Fixed costs mean that as sales grow:', opts:['Margin tends to improve','Margin tends to fall'], a:0}},

{id:'q-margin3', lvl:2, t:'Margin against growth',
 q:'Company A grows 4% with a 30% margin. Company B grows 35% with a 9% margin. Which is the better business?',
 opts:['Neither automatically — it depends which number is the real story','A, because margins always win','B, because growth always wins','They are identical'], a:0,
 why:'Neither wins by default. A fat margin on a business going nowhere gets competed away or simply stops mattering. Fast growth on a thin margin is superb if the margin improves with scale and fatal if it never does. Deciding which is the real story is the actual skill.',
 card:'This is the judgement the game asks for on every card, and naming which number decided it is the "reason" you have to give.',
 check:{q:'When growth and margin disagree:', opts:['You decide which one is the real story','You always take the higher margin'], a:0}},

/* ---------- 3. The balance sheet: who decides in a bad year ---------- */
{id:'q-debt', lvl:3, t:'Debt',
 q:'What is debt?',
 opts:['Money the company borrowed and must pay back with interest','Money customers owe the company','The value of its buildings','Its share price'], a:0,
 why:'Debt is borrowed money with a deadline and interest attached. Borrowing is not automatically bad — it is how factories, shops and warehouses get built. What matters is whether the business reliably earns enough to service it.',
 card:'The card shows debt as <strong>Debt / EBITDA</strong>, which measures the burden rather than the raw amount. A big company with big debts can be far safer than a small one with small debts.',
 check:{q:'Debt is:', opts:['Borrowed money that must be repaid','Money owed to the company'], a:0}},

{id:'q-assets', lvl:3, t:'Assets',
 q:'Which of these is an asset of a delivery company?',
 opts:['Its vans','Its bank loan','Its wage bill','Its rent'], a:0,
 why:'An asset is something the company owns that helps it earn: vans, buildings, stock, cash, money owed by customers. A loan is the opposite — something it owes. Wages and rent are neither; they are costs that come and go.',
 card:'Assets do not appear on the card, but they are why some businesses can carry far more debt than others. Lenders will advance more against vans they can repossess than against an idea.',
 check:{q:'An asset is something the company:', opts:['Owns','Owes'], a:0}},

{id:'q-equity', lvl:3, t:'What the owners have',
 q:'A company has $10m of assets and $6m of debt. What belongs to the shareholders?',
 opts:['$4m','$10m','$6m','$16m'], a:0,
 why:'What the owners have is whatever is left after the lenders are paid: $10m less $6m is $4m. Lenders are always first in the queue, which is the whole reason debt is dangerous — in a bad year the shareholders absorb the loss before the lenders feel anything.',
 card:'It is why a heavily indebted company\u2019s shares can fall much further than its business does. The debt is fixed and the shareholders take the swing.',
 check:{q:'In a bad year, who takes the loss first?', opts:['Shareholders','Lenders'], a:0}},

{id:'q-ebitda', lvl:3, t:'EBITDA, in plain English',
 q:'EBITDA is a rough measure of what?',
 opts:['The cash a business throws off from trading, before interest and tax','The share price','Total sales','The tax bill'], a:0,
 why:'EBITDA is a rough stand-in for the cash a business generates from trading, before interest, tax and accounting charges for wear and tear. It is imperfect — it flatters companies that constantly need new equipment — but it is the yardstick lenders use.',
 card:'It matters because it is the bottom half of the leverage ratio on the card. Debt only means anything relative to what the business earns.',
 check:{q:'EBITDA roughly measures:', opts:['Cash generated from trading','Money left after all costs and tax'], a:0}},

{id:'q-lev1', lvl:3, t:'Reading leverage',
 q:'A company has Debt / EBITDA of 5 times. What does that mean?',
 opts:['Its debts are about five years of current earnings','It earns five times what it borrowed','Its debt grew 5%','It has five separate loans'], a:0,
 why:'Five times means the debt is roughly five years of what the business currently earns. Under 2 times is generally comfortable; above 4, one bad year can mean a missed payment. At that point the lenders, not the managers, start deciding what happens next.',
 card:'On a card this is the number that decides survival. A business can look superb on growth and margin and still be handed to its creditors because a repayment fell due in a bad quarter.',
 check:{q:'Leverage of 5x means:', opts:['About five years of earnings owed','Five percent of revenue owed'], a:0}},

{id:'q-interest', lvl:3, t:'Can it pay the interest?',
 q:'A company earns $10m a year and its annual interest bill is $9m. What should you think?',
 opts:['Almost everything it earns goes to lenders, so it has no room for a bad year','It is comfortably financed','Interest does not matter','It has no debt'], a:0,
 why:'Interest is not optional. If it swallows nine tenths of earnings, a fall of even 10% means the company cannot pay it. Businesses rarely fail because profits fell; they fail because a payment came due and the money was not there.',
 card:'The leverage number on the card is a shortcut for exactly this. High leverage means a large fixed bill arriving whatever happens to sales.',
 check:{q:'A large interest bill relative to earnings means:', opts:['No room for a bad year','A well-financed company'], a:0}},

{id:'q-lev2', lvl:3, t:'Why leverage bites',
 q:'Two identical companies both see sales fall 20%. One has no debt, one is at 5 times. What happens?',
 opts:['The indebted one may be forced to sell assets or refinance on bad terms','Both are equally affected','The indebted one is safer','Nothing — debt is fixed'], a:0,
 why:'The interest bill does not fall when sales do. The debt-free company has a bad year; the indebted one may break the terms of its loans and be forced to sell assets, raise money cheaply or hand over control. Debt turns a bad year into a permanent loss.',
 card:'It is why leverage often decides a comparison even when the indebted company looks better on growth and margin. It is the axis that only matters when things go wrong — and things go wrong.',
 check:{q:'In a downturn, debt:', opts:['Turns a bad year into a permanent loss','Falls along with sales'], a:0}},

{id:'q-lev3', lvl:3, t:'When debt is fine',
 q:'Which business can most safely carry high debt?',
 opts:['A water utility with regulated, predictable revenue','A fashion retailer chasing trends','A film studio','A mining explorer'], a:0,
 why:'Debt is dangerous in proportion to how uncertain your earnings are. A regulated utility knows roughly what it will earn for years, so it can safely carry borrowings that would destroy a fashion chain whose sales swing with the weather and taste.',
 card:'This is why leverage has to be read against the sector on the card, not against an absolute rule. Four times is alarming for a retailer and unremarkable for a utility.',
 check:{q:'Safe debt levels depend on:', opts:['How predictable the earnings are','The size of the company'], a:0}},

/* ---------- 4. Cash: why profit is not money ---------- */
{id:'q-cash1', lvl:4, t:'Profit is not cash',
 q:'A company reports $10m of profit but its bank balance barely moved. How?',
 opts:['Customers have not paid yet, or the cash went into stock and equipment','It must be fraud','Profit always equals cash','It paid too much tax'], a:0,
 why:'Profit is recorded when a sale is agreed, not when the money arrives. A company can book a big profit while the cash is still sitting in unpaid invoices, or has already gone into inventory and machines. Profit is an opinion shaped by accounting rules; cash is a fact.',
 card:'This gap is exactly what the <strong>cash conversion</strong> row measures. It is the single best check on whether the margin above it is real.',
 check:{q:'Profit and cash differ because:', opts:['Profit is recorded before the cash arrives','Companies hide cash'], a:0}},

{id:'q-wc', lvl:4, t:'Money tied up in the business',
 q:'A growing shop must buy stock before it can sell it. What does that do to its cash?',
 opts:['It ties cash up — the faster it grows, the more is tied up','It releases cash','It has no effect','It reduces its costs'], a:0,
 why:'Every extra sale usually needs stock bought and wages paid before the customer pays. So growth consumes cash rather than producing it. This is why fast-growing companies so often need to raise money despite being profitable.',
 card:'It is the mechanism behind weak cash conversion on a fast-growing card. The growth is real; it is just being paid for up front.',
 check:{q:'For a growing business, growth usually:', opts:['Consumes cash before it produces it','Produces cash immediately'], a:0}},

{id:'q-capex', lvl:4, t:'Spending to keep going',
 q:'A haulage firm must replace worn-out trucks every few years. What is that spending called?',
 opts:['Capital expenditure — money spent on long-lived equipment','A cost of sales','A dividend','Interest'], a:0,
 why:'Capital expenditure is money spent on things that last years, like trucks, machines and buildings. It does not appear in profit all at once, which is why a company can look profitable while quietly spending everything it earns just to stand still.',
 card:'Heavy replacement spending is one of the main reasons a healthy-looking margin converts poorly into cash.',
 check:{q:'Capital expenditure is spending on:', opts:['Long-lived equipment','This month\u2019s wages'], a:0}},

{id:'q-depr', lvl:4, t:'Wear and tear',
 q:'A $100,000 machine expected to last ten years is charged against profit at roughly $10,000 a year. Why not all at once?',
 opts:['Because it is used over ten years, so the cost is spread over ten years','To hide the spending','Because of tax rules only','It is a mistake'], a:0,
 why:'Spreading the cost matches it to the years the machine actually helps earn. That is fairer than a single huge hit. But the cash all left on day one, which is one reason profit and cash move differently.',
 card:'It also explains EBITDA: that measure deliberately adds this charge back, which is why it flatters companies that constantly need new equipment.',
 check:{q:'Spreading an asset\u2019s cost over its life:', opts:['Matches the cost to the years it helps earn','Hides the spending'], a:0}},

{id:'q-cash2', lvl:4, t:'Cash conversion',
 q:'A company converts 30% of its profit into cash. What should you think?',
 opts:['Most of the reported profit is not arriving as spendable money','It is very profitable','It has 30% margins','It pays 30% tax'], a:0,
 why:'Only 30 cents of every reported profit dollar is turning into cash. Either the company is spending everything just to stand still, or the profits are more accounting than reality. Sustained low conversion is one of the most reliable warning signs there is.',
 card:'A high margin beside low conversion is a classic trap: the margin looks like quality, and the conversion tells you it is not reaching the bank.',
 check:{q:'Low cash conversion means:', opts:['Reported profit is not becoming spendable cash','The company is growing fast'], a:0}},

{id:'q-fcf', lvl:4, t:'Free cash flow',
 q:'What is free cash flow?',
 opts:['Cash left after paying everything needed to keep the business running','Total sales','Profit before tax','Cash sitting in the bank'], a:0,
 why:'Free cash flow is what remains after the company has paid for everything required to keep operating, including replacing worn-out equipment. It is the money genuinely available to repay debt, buy back shares or survive a shock — the number that decides whether a business has choices.',
 card:'The finance course adds it to every card as margin multiplied by cash conversion. Two companies can show the same margin and completely different free cash flow.',
 check:{q:'Free cash flow is money available to:', opts:['Repay debt or survive a shock','Pay this month\u2019s wages'], a:0}},

{id:'q-cash3', lvl:4, t:'Failing while profitable',
 q:'Can a profitable company run out of money and collapse?',
 opts:['Yes — if the cash arrives later than the bills','No, profit protects it','Only if it is fraudulent','Only during a recession'], a:0,
 why:'It happens constantly, and fast-growing companies are the most exposed: every new order means paying for stock and wages now and collecting later. Profit on paper is no defence against a payment falling due today.',
 card:'It is why growth, weak conversion and debt together is the most dangerous combination on a card — and why it usually looks like the exciting company.',
 check:{q:'A profitable company can fail when:', opts:['Cash arrives later than the bills','It holds too much cash'], a:0}},

{id:'q-cashq', lvl:4, t:'Which number would you trust?',
 q:'Two companies report identical profits. One converts 90% to cash, the other 25%. Which profit figure do you trust more?',
 opts:['The one converting 90% — the cash confirms it','The one converting 25%','Both equally','Neither'], a:0,
 why:'Cash is much harder to manipulate than profit. When reported profit is backed by cash actually arriving, the profit figure is confirmed. When it is not, you are relying on judgements about when to record a sale and how to value stock — and those judgements can be optimistic.',
 card:'This is why cash conversion is worth paying for on a card. It is not another performance measure; it is a check on the honesty of the ones above it.',
 check:{q:'Cash conversion is best understood as:', opts:['A check on whether the profit is real','Another growth measure'], a:0}},

/* ---------- 5. Valuation: what you are paying ---------- */
{id:'q-eps', lvl:5, t:'Profit per share',
 q:'A company earns $20m and has 10m shares. What does each share earn?',
 opts:['$2','$20m','10 cents','$200m'], a:0,
 why:'Earnings per share is profit divided by the number of shares: $20m over 10m shares is $2 each. It matters because you buy shares, not whole companies — and if a company issues lots of new shares, total profit can rise while your slice of it shrinks.',
 card:'The P/E on a card is the share price divided by exactly this number.',
 check:{q:'Earnings per share is:', opts:['Profit divided by the number of shares','Profit multiplied by the share price'], a:0}},

{id:'q-pe1', lvl:5, t:'What P/E means',
 q:'A company trades on a P/E of 20. What are you paying?',
 opts:['Twenty years of current profits','20% of its value','Twenty times its revenue','Twenty cents per share'], a:0,
 why:'Price to earnings is the price divided by annual profit, so 20 times means you are paying twenty years of profit at today\u2019s rate. Nobody expects to wait twenty years — you are betting profits grow. The multiple is the market\u2019s expectation written as a number.',
 card:'It is the price tag. Every other number tells you what you are buying; this one tells you what it costs.',
 check:{q:'A P/E of 20 means:', opts:['Twenty years of current profits','A 20% annual return'], a:0}},

{id:'q-yield', lvl:5, t:'Turning it upside down',
 q:'A company trades on a P/E of 10. Roughly what percentage of your money does it earn each year?',
 opts:['About 10%','About 1%','About 100%','You cannot tell'], a:0,
 why:'Flipping the multiple gives you a rough annual return: 1 divided by 10 is 10%. On a P/E of 25 it is 4%. This is the quickest sanity check there is — if a company only earns 2% of what you paid, you are relying entirely on that changing.',
 card:'It is a useful way to read the P/E row: a 50 times multiple means a 2% earnings return today, and everything else is hope.',
 check:{q:'A high P/E means the earnings return today is:', opts:['Low','High'], a:0}},

{id:'q-pe3', lvl:5, t:'Price against growth',
 q:'Two companies both trade on 15 times. One grows 3% a year, the other 25%. Which is more expensive?',
 opts:['The one growing 3%','The one growing 25%','They cost the same','You cannot tell'], a:0,
 why:'The same multiple buys very different futures. In three years the fast grower has roughly doubled its profits, so the price you paid now looks like about 8 times; the slow one has barely moved. Identical price tags on different growth are not the same price.',
 card:'It is why the P/E row can never be read alone. Cheap relative to what is the whole question, and the growth row is half the answer.',
 check:{q:'The same P/E on faster growth is:', opts:['Effectively cheaper','Effectively dearer'], a:0}},

{id:'q-pe2', lvl:5, t:'Is cheap really cheap?',
 q:'A company trades on 6 times while its rivals trade on 18. What is the most useful first thought?',
 opts:['Ask what the market knows that makes it worth so much less','It is obviously a bargain','It will rise to 18 times','The market has made an error'], a:0,
 why:'A low multiple is a forecast, not a discount. The market is usually pricing something specific: a patent expiring, a shrinking core business, a regulator circling. Sometimes it is wrong, and that is where money is made — but the question is always "what am I seeing that they are not", never "this is cheap".',
 card:'This is the difference between a value call and a trap. The other four numbers on the card exist to tell you which one you are looking at.',
 check:{q:'A very low multiple is usually:', opts:['The market pricing a known problem','A pricing error'], a:0}},

{id:'q-cyc', lvl:5, t:'Cheap at the top',
 q:'A copper miner shows record profits and its lowest ever P/E after copper prices doubled. What is the risk?',
 opts:['The profits are at a cycle peak, so the multiple is cheap on earnings that will not last','There is no risk, it is cheap','Copper prices never fall','Its debt must be low'], a:0,
 why:'For companies whose profits swing with a commodity, the multiple looks cheapest exactly at the top — because the earnings underneath it are temporarily huge. Normalise those profits back to a typical year and the cheap 6 times often turns into an expensive 20.',
 card:'It is why a very low multiple on a cyclical business is a warning rather than an invitation, and why the other numbers have to be read alongside it.',
 check:{q:'A cyclical company looks cheapest:', opts:['At the peak of its cycle','At the bottom of its cycle'], a:0}},

{id:'q-comb', lvl:5, t:'Price and safety together',
 q:'Two companies both trade on 9 times. One has no debt, the other is at 5 times leverage. Which is riskier?',
 opts:['The indebted one — the same price buys a far more fragile business','The debt-free one','They are equally risky','Debt does not affect risk'], a:0,
 why:'The multiple only prices the equity. Buying a company on 9 times with heavy borrowings means buying a small slice of something that the lenders effectively control in a downturn. The same price tag can buy wildly different amounts of risk.',
 card:'This is why the P/E and the leverage rows have to be read together. Cheap and fragile is not the same as cheap.',
 check:{q:'The same multiple on a heavily indebted company is:', opts:['Riskier','Safer'], a:0}},

{id:'q-pe4', lvl:5, t:'Putting it all together',
 q:'A company shows 40% growth, a 6% margin, 4.5 times debt and 20% cash conversion. What is your first concern?',
 opts:['The growth is funded by borrowing and is not turning into cash','That growth is superb','The margin is perfectly healthy','There is nothing worrying here'], a:0,
 why:'Each number alone is survivable. Together they describe a company growing fast on borrowed money, keeping very little of what it sells, and converting almost none of that into cash. The growth is real — and it is being funded by lenders rather than by customers.',
 card:'Reading the numbers together rather than one at a time is the whole skill. The card is built so that any single metric can mislead you and the combination cannot.',
 check:{q:'The numbers should be read:', opts:['Together, as one picture','One at a time, best score wins'], a:0}}
];

/* ---------- economics ----------
   Meaningful early, marginal later, and worth almost nothing on a repeat. */
const TUTOR_BASE=()=>14+tutorLevel*3;      /* paid for working through the lesson */
const TUTOR_BONUS=()=>18+tutorLevel*5;     /* added for a correct first answer   */
const TUTOR_CHECK=()=>6+tutorLevel*2;      /* added for the comprehension check  */
/* The monthly ceiling is the real control. At level 1 it is about a third of
   early net income, so teaching shortens the wait for a car without ever
   replacing the desk as the way you actually get rich. */
const tutorCap=()=>240+tutorLevel*110;
const tutorSeenCount=id=>tutorSeen[id]||0;
const tutorDecay=id=>1/(1+tutorSeenCount(id)*0.7);
const tutorRoomLeft=()=>Math.max(0,tutorCap()-tutorEarnedMonth);

const tutorPool=()=>QUESTIONS.filter(q=>q.lvl<=tutorLevel);
/* Unseen questions always come first, and unseen questions in the band you are
   working on come before those. Only once everything available has been seen
   does it start cycling, and by then the decay has made repeats nearly unpaid. */
const pickOne=a=>a[Math.floor(Math.random()*a.length)];
function tutorPick(){
  const pool=tutorPool();
  const unseen=pool.filter(q=>!tutorSeenCount(q.id));
  const band=unseen.filter(q=>q.lvl===tutorLevel);
  if(band.length) return pickOne(band);
  if(unseen.length) return pickOne(unseen);
  /* prefer what you have seen least, so the bank is worked through rather than farmed */
  const min=Math.min(...pool.map(q=>tutorSeenCount(q.id)));
  const fresh=pool.filter(q=>tutorSeenCount(q.id)===min);
  return fresh[Math.floor(Math.random()*fresh.length)];
}
/* Levelling counts DISTINCT questions answered correctly, and the threshold is
   always below the size of the band, so nobody is ever forced to grind the same
   question to progress. Each band holds 8; five different ones open the next. */
const TUTOR_PER_LEVEL=5;
const tutorNeededForLevel=()=>TUTOR_PER_LEVEL;
const tutorBandMastered=()=>QUESTIONS.filter(q=>q.lvl===tutorLevel&&tutorRight[q.id]).length;
function tutorMaybeLevel(){
  if(tutorLevel>=TUTOR_LEVELS.length) return false;
  if(tutorBandMastered()<tutorNeededForLevel()) return false;
  tutorLevel++; rep+=2;
  return true;
}

/* ---------- the room ---------- */
function roomTutor(){
  if(!tutorReg) return tutorRegisterScreen();
  const lv=TUTOR_LEVELS[tutorLevel-1];
  const soundNow=idx?Math.round((quad.gpgo+quad.gpbo)/idx*100):0;
  $('sheet').innerHTML=`<div class="roomhd"><h2>Tutoring</h2>
      <span class="sub">Level ${tutorLevel} · ${lv.n} · earned ${money(tutorEarnedMonth)} of ${money(tutorCap())} this month</span></div>
    <p class="note k">You are paid for working through the explanation, not for already knowing the
      answer. A wrong answer earns nearly as much as a right one, and teaches more. Repeating a
      question you have already done pays a fraction of it.</p>
    <div class="ledger">
      <div class="lr"><span>Level</span><span>${tutorLevel} of ${TUTOR_LEVELS.length} · ${lv.n}</span></div>
      <div class="lr"><span>Toward the next level</span><span>${tutorLevel>=TUTOR_LEVELS.length?'top level reached':tutorBandMastered()+' of '+tutorNeededForLevel()+' topics mastered'}</span></div>
      <div class="lr"><span>Questions worked</span><span>${tutorAnswered}</span></div>
      <div class="lr"><span>Room left this month</span><span class="${tutorRoomLeft()?'pos':'neg'}">${money(tutorRoomLeft())}</span></div>
      ${tutorStartSound!==null&&idx>0?`<div class="lr"><span>Your sound rate since you started teaching</span>
        <span class="${soundNow>=tutorStartSound?'pos':''}">${tutorStartSound}% → ${soundNow}%</span></div>`:''}
    </div>
    <p class="note">${lv.d}</p>
    <button class="btn" id="tqGo" ${tutorRoomLeft()>0?'':'disabled'}>${
      tutorRoomLeft()>0?'Take a question':'No paid slots left this month'}</button>
    ${tutorRoomLeft()>0?'':'<p class="note">You can still study for nothing — the explanations do not run out.</p>'}
    <button class="btn ghost" id="tqFree">Study without pay</button>
    <button class="btn ghost" id="tqOut">Leave</button>`;
  $('tqGo').addEventListener('click',()=>askQuestion(true));
  $('tqFree').addEventListener('click',()=>askQuestion(false));
  $('tqOut').addEventListener('click',leave);
  bindTerms();
}

function tutorRegisterScreen(){
  $('sheet').innerHTML=`<div class="roomhd"><h2>Register as a tutor</h2>
      <span class="sub">City Institute · evening work</span></div>
    <p class="note">The Institute needs people to take beginners through the basics of company
      accounts. It pays, and it is the only work in this city that makes you better at the thing you
      actually do all day.</p>
    <p class="note k">You are paid per lesson worked through, not per correct answer. That is
      deliberate: this is teaching, and the person who has to look something up has learned more
      than the person who already knew it.</p>
    <div class="ledger">
      <div class="lr"><span>Pay</span><span class="pos">about ${money(TUTOR_BASE()+TUTOR_BONUS()+TUTOR_CHECK())} a lesson at first</span></div>
      <div class="lr"><span>Monthly ceiling</span><span>${money(420+220)}, rising with your level</span></div>
      <div class="lr"><span>Repeat questions</span><span class="neg">pay a fraction</span></div>
      <div class="lr"><span>Cost to register</span><span>Nothing</span></div>
    </div>
    <button class="btn" id="tReg">Register</button>
    <button class="btn ghost" id="tRegOut">Not now</button>`;
  $('tReg').addEventListener('click',()=>{
    tutorReg=true;
    tutorStartSound=idx?Math.round((quad.gpgo+quad.gpbo)/idx*100):null;
    hud(); save(); roomTutor();
    toast('Registered. The Institute will send students.');
  });
  $('tRegOut').addEventListener('click',leave);
}

/* ---------- one lesson ---------- */
function askQuestion(paid){
  const q=tutorPick();
  tutorCurrent={q,paid,answered:null};
  $('sheet').innerHTML=`<div class="roomhd"><h2>${q.t}</h2>
      <span class="sub">Level ${q.lvl} · ${paid?'paid lesson':'study, unpaid'}</span></div>
    <p class="tq">${q.q}</p>
    <div class="tqopts">${q.opts.map((o,i)=>
      `<button class="tqo" data-i="${i}">${o}</button>`).join('')}</div>
    <p class="note k" style="margin-top:16px">Answer either way — the explanation comes next
      regardless, and that is the part that pays.</p>`;
  document.querySelectorAll('.tqo').forEach(el=>el.addEventListener('click',()=>
    explainAnswer(+el.dataset.i)));
  $('ov').scrollTop=0;
}

function explainAnswer(chosen){
  const {q,paid}=tutorCurrent;
  const right=chosen===q.a;
  tutorCurrent.answered=chosen; tutorCurrent.right=right;
  $('sheet').innerHTML=`<div class="roomhd"><h2>${q.t}</h2>
      <span class="sub">${right?'You had it':'Worth going through'}</span></div>
    <div class="verdict ${right?'ok':'no'}">
      <div class="vhd">${right?'Correct':'Not quite'}</div>
      <div class="vb"><strong>The answer is:</strong> ${q.opts[q.a]}
        ${right?'':`<br><span class="vyou">You said: ${q.opts[chosen]}</span>`}</div>
    </div>
    <section class="lesson">
      <div class="lhd">Why</div>
      <p>${q.why}</p>
      <div class="lhd">On a company card</div>
      <p>${q.card}</p>
    </section>
    <div class="step"><div class="steplbl"><span>One check, so it sticks</span></div>
      <p class="tq small">${q.check.q}</p>
      <div class="tqopts">${q.check.opts.map((o,i)=>
        `<button class="tqo" data-c="${i}">${o}</button>`).join('')}</div></div>`;
  document.querySelectorAll('.tqo[data-c]').forEach(el=>el.addEventListener('click',()=>
    finishLesson(+el.dataset.c)));
  $('ov').scrollTop=0;
}

function finishLesson(checkChosen){
  const {q,paid,right}=tutorCurrent;
  const checkRight=checkChosen===q.check.a;
  let paidOut=0;
  if(paid){
    const decay=tutorDecay(q.id);
    let gross=TUTOR_BASE()+(right?TUTOR_BONUS():0)+(checkRight?TUTOR_CHECK():0);
    gross=Math.round(gross*decay);
    paidOut=Math.min(gross,tutorRoomLeft());
    cash+=paidOut; tutorEarnedMonth+=paidOut;
  }
  tutorSeen[q.id]=tutorSeenCount(q.id)+1;
  tutorAnswered++;
  if(right){ tutorLevelCorrect++; tutorRight[q.id]=true; }
  const levelled=tutorMaybeLevel();
  hud(); save();

  const repeat=tutorSeenCount(q.id)>1;
  $('sheet').innerHTML=`<div class="roomhd"><h2>Lesson done</h2>
      <span class="sub">${q.t}</span></div>
    <div class="lesson">
      <div class="lhd">${checkRight?'Check: right':'Check: the answer was — '+q.check.opts[q.check.a]}</div>
      <p>${checkRight?'That is the idea in one line. Keep it.'
        :'Worth re-reading the explanation above — that one line is the whole concept.'}</p>
    </div>
    ${paid?`<div class="ledger">
      <div class="lr"><span>Lesson worked</span><span class="pos">+${money(Math.round(TUTOR_BASE()*tutorDecay(q.id)))}</span></div>
      ${right?`<div class="lr"><span>Answer correct</span><span class="pos">+${money(Math.round(TUTOR_BONUS()*tutorDecay(q.id)))}</span></div>`:''}
      ${checkRight?`<div class="lr"><span>Check correct</span><span class="pos">+${money(Math.round(TUTOR_CHECK()*tutorDecay(q.id)))}</span></div>`:''}
      ${repeat?`<div class="lr"><span>Repeat question</span><span class="neg">×${tutorDecay(q.id).toFixed(2)}</span></div>`:''}
      <div class="lr"><span>Paid</span><span class="pos">+${money(paidOut)}</span></div>
      <div class="lr"><span>Left this month</span><span>${money(tutorRoomLeft())}</span></div>
    </div>`:`<p class="note">Studied for nothing. The explanation was the same.</p>`}
    ${levelled?`<p class="note k"><strong>Level ${tutorLevel} · ${TUTOR_LEVELS[tutorLevel-1].n}.</strong>
      ${TUTOR_LEVELS[tutorLevel-1].d} Harder questions, and the pay goes up with them.</p>`:''}
    <button class="btn" id="tNext" ${tutorRoomLeft()>0?'':'disabled'}>Another</button>
    <button class="btn ghost" id="tStudy">Another, unpaid</button>
    <button class="btn ghost" id="tDone">Back</button>`;
  if(levelled) moment('LEVEL '+tutorLevel,TUTOR_LEVELS[tutorLevel-1].n);
  $('tNext').addEventListener('click',()=>askQuestion(true));
  $('tStudy').addEventListener('click',()=>askQuestion(false));
  $('tDone').addEventListener('click',roomTutor);
  $('ov').scrollTop=0;
}
