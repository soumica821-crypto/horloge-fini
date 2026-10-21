COMMON = r'''
if not game:IsLoaded() then game.Loaded:Wait() end
local HttpService = game:GetService("HttpService")
local TeleportService = game:GetService("TeleportService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local LP = Players.LocalPlayer
local req = (syn and syn.request) or http_request or request or (http and http.request) or (fluxus and fluxus.request)
local qot = queue_on_teleport or (syn and syn.queue_on_teleport) or (fluxus and fluxus.queue_on_teleport)
local API = "__API__"
local PINK, GREY, GREEN, RED = Color3.fromRGB(255, 42, 133), Color3.fromRGB(160, 160, 171), Color3.fromRGB(52, 211, 153), Color3.fromRGB(248, 113, 113)

local function getHwid()
    local ok, id = pcall(function() return gethwid and gethwid() end)
    if ok and id then return tostring(id) end
    return game:GetService("RbxAnalyticsService"):GetClientId()
end

local function call(method, path, body, headers)
    if not req then return nil, "executor has no http request function" end
    local h = {["Content-Type"] = "application/json"}
    for k, v in pairs(headers or {}) do h[k] = v end
    local ok, res = pcall(req, {Url = API .. path, Method = method, Headers = h, Body = body and HttpService:JSONEncode(body) or nil})
    if not ok then return nil, tostring(res) end
    if not res or res.StatusCode ~= 200 then
        local msg = res and res.Body or "no response"
        pcall(function() msg = HttpService:JSONDecode(res.Body).detail or msg end)
        return nil, tostring(msg)
    end
    return HttpService:JSONDecode(res.Body)
end

-- ================= UI =================
local function new(class, props, parent)
    local o = Instance.new(class)
    for k, v in pairs(props) do o[k] = v end
    if parent then o.Parent = parent end
    return o
end
local function corner(o, r) new("UICorner", {CornerRadius = UDim.new(0, r or 10)}, o) end

local function guiParent()
    local ok, h = pcall(function() return gethui and gethui() end)
    if ok and h then return h end
    local ok2, cg = pcall(function() return game:GetService("CoreGui") end)
    if ok2 and cg then return cg end
    return LP:WaitForChild("PlayerGui")
end

local function buildUI(title)
    local parent = guiParent()
    local old = parent:FindFirstChild("HorlogeJoinerUI")
    if old then old:Destroy() end
    local sg = new("ScreenGui", {Name = "HorlogeJoinerUI", ResetOnSpawn = false, ZIndexBehavior = Enum.ZIndexBehavior.Sibling, DisplayOrder = 999})
    pcall(function() if syn and syn.protect_gui then syn.protect_gui(sg) end end)
    if not pcall(function() sg.Parent = parent end) then sg.Parent = LP:WaitForChild("PlayerGui") end
    local main = new("Frame", {Size = UDim2.fromOffset(390, 440), Position = UDim2.new(0, 24, 0.5, -220), BackgroundColor3 = Color3.fromRGB(10, 10, 14), BorderSizePixel = 0, Active = true, Draggable = true}, sg)
    corner(main, 14)
    new("UIStroke", {Color = PINK, Transparency = 0.55, Thickness = 1}, main)
    new("TextLabel", {Size = UDim2.new(1, -60, 0, 36), Position = UDim2.fromOffset(16, 8), BackgroundTransparency = 1, Text = title, Font = Enum.Font.GothamBlack, TextSize = 18, TextColor3 = PINK, TextXAlignment = Enum.TextXAlignment.Left}, main)
    local mini = new("TextButton", {Size = UDim2.fromOffset(28, 28), Position = UDim2.new(1, -42, 0, 12), BackgroundColor3 = Color3.fromRGB(30, 30, 38), Text = "-", TextColor3 = Color3.new(1, 1, 1), Font = Enum.Font.GothamBold, TextSize = 18, AutoButtonColor = true}, main)
    corner(mini, 8)
    local status = new("TextLabel", {Size = UDim2.new(1, -32, 0, 18), Position = UDim2.fromOffset(16, 44), BackgroundTransparency = 1, Text = "Starting...", Font = Enum.Font.GothamMedium, TextSize = 13, TextColor3 = GREY, TextXAlignment = Enum.TextXAlignment.Left, TextTruncate = Enum.TextTruncate.AtEnd}, main)
    local stats = new("TextLabel", {Size = UDim2.new(1, -32, 0, 18), Position = UDim2.fromOffset(16, 64), BackgroundTransparency = 1, Text = "", Font = Enum.Font.Gotham, TextSize = 12, TextColor3 = GREY, TextXAlignment = Enum.TextXAlignment.Left, TextTruncate = Enum.TextTruncate.AtEnd}, main)
    local button = new("TextButton", {Size = UDim2.new(1, -32, 0, 38), Position = UDim2.fromOffset(16, 90), BackgroundColor3 = PINK, Text = "...", Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = Color3.new(1, 1, 1), AutoButtonColor = true}, main)
    corner(button, 10)
    local list = new("ScrollingFrame", {Size = UDim2.new(1, -32, 1, -150), Position = UDim2.fromOffset(16, 138), BackgroundColor3 = Color3.fromRGB(16, 16, 22), BorderSizePixel = 0, ScrollBarThickness = 4, ScrollBarImageColor3 = PINK, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y}, main)
    corner(list, 10)
    new("UIListLayout", {Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder}, list)
    new("UIPadding", {PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 6), PaddingLeft = UDim.new(0, 6), PaddingRight = UDim.new(0, 10)}, list)
    local minimized = false
    mini.MouseButton1Click:Connect(function()
        minimized = not minimized
        list.Visible, button.Visible = not minimized, not minimized
        main.Size = minimized and UDim2.fromOffset(390, 88) or UDim2.fromOffset(390, 440)
    end)
    return {status = status, stats = stats, button = button, list = list}
end

local rowOrder = 0
local function addRow(ui, text, color, btnText, onClick)
    rowOrder = rowOrder - 1
    local row = new("Frame", {Size = UDim2.new(1, 0, 0, 34), BackgroundColor3 = Color3.fromRGB(24, 24, 32), BorderSizePixel = 0, LayoutOrder = rowOrder}, ui.list)
    corner(row, 8)
    new("TextLabel", {Size = UDim2.new(1, btnText and -72 or -14, 1, 0), Position = UDim2.fromOffset(8, 0), BackgroundTransparency = 1, Text = text, Font = Enum.Font.GothamMedium, TextSize = 12, TextColor3 = color or Color3.new(1, 1, 1), TextXAlignment = Enum.TextXAlignment.Left, TextTruncate = Enum.TextTruncate.AtEnd}, row)
    if btnText then
        local b = new("TextButton", {Size = UDim2.fromOffset(58, 24), Position = UDim2.new(1, -64, 0.5, -12), BackgroundColor3 = PINK, Text = btnText, Font = Enum.Font.GothamBold, TextSize = 12, TextColor3 = Color3.new(1, 1, 1)}, row)
        corner(b, 6)
        b.MouseButton1Click:Connect(onClick)
    end
    local rows = {}
    for _, c in ipairs(ui.list:GetChildren()) do if c:IsA("Frame") then table.insert(rows, c) end end
    if #rows > 40 then
        table.sort(rows, function(a, b) return a.LayoutOrder > b.LayoutOrder end)
        rows[1]:Destroy()
    end
end

-- ================= SCANNER (Steal a Brainrot) =================
local function txt(o)
    if not o or not (o:IsA("TextLabel") or o:IsA("TextButton") or o:IsA("TextBox")) then return nil end
    local ok, t = pcall(function() return o.ContentText end)
    if ok and t and t ~= "" then return t end
    return o.Text
end

local function readOverhead(ov)
    local name = txt(ov:FindFirstChild("DisplayName", true))
    if not name or name == "" or name == "DisplayName" then return nil end
    local m = ov:FindFirstChild("Mutation", true)
    local mut = (m and m.Visible and txt(m)) or "Normal"
    if mut == "" or mut == "Mutation" then mut = "Normal" end
    return {name = name, mutation = mut, generation = txt(ov:FindFirstChild("Generation", true)) or ""}
end

local ANIMALS = {}
pcall(function()
    for _, a in ipairs(ReplicatedStorage.Models.Animals:GetChildren()) do ANIMALS[a.Name] = true end
end)

-- Scans every plot / podium / brainrot of the whole server
local function scan()
    local found, seen = {}, {}
    local function push(key, d) if d and not seen[key] then seen[key] = true; table.insert(found, d) end end
    local plots = workspace:FindFirstChild("Plots")
    if plots then
        for _, plot in ipairs(plots:GetChildren()) do
            local pods = plot:FindFirstChild("AnimalPodiums")
            if pods then
                for _, pod in ipairs(pods:GetChildren()) do
                    local ov = pod:FindFirstChild("AnimalOverhead", true)
                    if ov then push(ov, readOverhead(ov)) end
                end
            end
        end
    end
    for _, d in ipairs(workspace:GetDescendants()) do
        if d.Name == "AnimalOverhead" then push(d, readOverhead(d)) end
    end
    if #found == 0 and plots and next(ANIMALS) then
        for _, d in ipairs(plots:GetDescendants()) do
            if d:IsA("Model") and ANIMALS[d.Name] then
                push(d, {name = d.Name, mutation = tostring(d:GetAttribute("Mutation") or "Normal"), generation = ""})
            end
        end
    end
    return found
end

-- Scans repeatedly (max 4.5s) until the result is stable, to catch streamed-in plots
local function deepScan()
    local t0, last, stable, all = tick(), -1, tick(), {}
    repeat
        all = scan()
        if #all ~= last then last, stable = #all, tick() end
        task.wait(0.35)
    until tick() - t0 >= 4.5 or (tick() - t0 >= 1.2 and tick() - stable >= 0.9)
    return all, tick() - t0
end

local function httpGet(url)
    local ok, body = pcall(function() return game:HttpGet(url) end)
    if ok and body then return body end
    if req then
        local ok2, res = pcall(req, {Url = url, Method = "GET"})
        if ok2 and res then return res.Body end
    end
    return nil
end

local function hop()
    local placeId = game.PlaceId
    local body = httpGet(("https://games.roblox.com/v1/games/%d/servers/Public?sortOrder=Desc&limit=100&excludeFullGames=true"):format(placeId))
    local servers = {}
    if body then
        pcall(function()
            for _, s in ipairs(HttpService:JSONDecode(body).data or {}) do
                if s.id ~= game.JobId and s.playing and s.maxPlayers and s.playing < s.maxPlayers - 1 then table.insert(servers, s.id) end
            end
        end)
    end
    if #servers > 0 then
        TeleportService:TeleportToPlaceInstance(placeId, servers[math.random(1, #servers)], LP)
    else
        TeleportService:Teleport(placeId, LP)
    end
end
'''

CLIENT = COMMON + r'''
-- ===== Horloge Joiner : Auto Joiner =====
local KEY = (getgenv and getgenv().script_key) or script_key
local HWID = getHwid()
local ui = buildUI("Horloge Joiner")
local auth, err = call("POST", "/script/auth", {key = KEY, hwid = HWID})
if not auth then
    ui.status.Text, ui.status.TextColor3 = "Auth failed: " .. tostring(err), RED
    ui.button.Text = "Get a slot on the website"
    return
end
local autoJoin = auth.auto_join
ui.status.Text, ui.status.TextColor3 = "Connected as " .. auth.username .. " - waiting for logs...", GREEN
ui.stats.Text = "Divisions: " .. table.concat(auth.divisions, ", ")
local function refreshBtn()
    ui.button.Text = autoJoin and "AUTO JOIN: ON" or "AUTO JOIN: OFF"
    ui.button.BackgroundColor3 = autoJoin and PINK or Color3.fromRGB(40, 40, 50)
end
refreshBtn()
ui.button.MouseButton1Click:Connect(function()
    local r = call("POST", "/script/settings", {key = KEY, hwid = HWID, auto_join = not autoJoin})
    if r then autoJoin = r.auto_join; refreshBtn() end
end)

local function join(log)
    ui.status.Text, ui.status.TextColor3 = ("Joining %s [%s] %s..."):format(log.name, log.mutation, log.value_text), PINK
    pcall(function() TeleportService:TeleportToPlaceInstance(log.place_id, log.job_id, LP) end)
end
TeleportService.TeleportInitFailed:Connect(function(_, result)
    ui.status.Text, ui.status.TextColor3 = "Join failed (" .. tostring(result) .. ") - waiting next log", RED
end)

if auth.self_bot then
    task.spawn(function()
        local found = scan()
        if #found > 0 then call("POST", "/script/report", {key = KEY, hwid = HWID, job_id = game.JobId, place_id = game.PlaceId, players = #Players:GetPlayers(), brainrots = found}) end
    end)
end

local TIER_COLORS = {og = Color3.fromRGB(255, 59, 59), peak = Color3.fromRGB(255, 212, 0), high = Color3.fromRGB(180, 92, 255), mid = PINK}
local since, seen = auth.server_time, {}
while true do
    local data = call("POST", "/script/poll", {key = KEY, hwid = HWID, since = since})
    if data then
        since = data.server_time
        local best
        for _, log in ipairs(data.logs) do
            if not seen[log.id] and log.job_id ~= game.JobId then
                seen[log.id] = true
                addRow(ui, ("%s [%s] %s"):format(log.name, log.mutation, log.value_text), TIER_COLORS[log.tier], "JOIN", function() join(log) end)
                if not best then best = log end
            end
        end
        if best and autoJoin then join(best) end
    end
    task.wait(1)
end
'''

OWNER_SELFBOT = COMMON + r'''
-- ===== Horloge Joiner : OWNER SELF BOT =====
local KEY = (getgenv and getgenv().script_key) or script_key
local HWID = getHwid()
local LOADER = 'getgenv().script_key="' .. tostring(KEY) .. '"; loadstring(game:HttpGet("' .. API .. '/script/selfbot.lua"))()'
local ui = buildUI("Horloge Self Bot")
local st, err = call("POST", "/script/selfbot/status", {key = KEY, hwid = HWID})
if not st then
    ui.status.Text, ui.status.TextColor3 = "Auth failed: " .. tostring(err), RED
    return
end
local enabled, running, queued = st.enabled, false, false
local function setStatus(t, c) ui.status.Text, ui.status.TextColor3 = t, c or GREY end
local function setStats(s) ui.stats.Text = ("Servers scanned: %d  |  Brainrots shared: %d"):format(s.runs or 0, s.logged or 0) end
local function refreshBtn()
    ui.button.Text = enabled and "STOP SELF BOT" or "START SELF BOT"
    ui.button.BackgroundColor3 = enabled and Color3.fromRGB(70, 20, 32) or PINK
end
setStats(st)
refreshBtn()

TeleportService.TeleportInitFailed:Connect(function(_, result)
    setStatus("Hop failed (" .. tostring(result) .. "), retrying...", RED)
end)

local cycle
cycle = function()
    if running then return end
    running = true
    while enabled do
        setStatus("Scanning server " .. string.sub(game.JobId, 1, 8) .. "...", PINK)
        local found, took = deepScan()
        local r, e = call("POST", "/script/report", {key = KEY, hwid = HWID, job_id = game.JobId, place_id = game.PlaceId, players = #Players:GetPlayers(), brainrots = found, selfbot = true})
        for _, b in ipairs(found) do
            addRow(ui, ("%s [%s] %s"):format(b.name, b.mutation, b.generation), Color3.new(1, 1, 1))
        end
        if r then
            setStats(r)
            setStatus(("%d brainrots scanned, %d shared in %.1fs -> hopping"):format(#found, r.inserted, took), GREEN)
        else
            setStatus("Report failed: " .. tostring(e), RED)
        end
        local s2 = call("POST", "/script/selfbot/status", {key = KEY, hwid = HWID})
        if s2 then enabled = s2.enabled end
        if not enabled then break end
        if qot and not queued then queued = true; qot(LOADER) end
        pcall(hop)
        task.wait(6)
    end
    running = false
    setStatus("Self bot stopped. Press START to run.", GREY)
    refreshBtn()
end

ui.button.MouseButton1Click:Connect(function()
    local r = call("POST", "/script/selfbot/set", {key = KEY, hwid = HWID, enabled = not enabled})
    if r then
        enabled = r.enabled
        refreshBtn()
        if enabled then task.spawn(cycle) end
    end
end)

if enabled then
    task.spawn(cycle)
else
    setStatus("Self bot stopped. Press START to run.", GREY)
end
'''

BOT = COMMON + r'''
-- ===== Horloge Joiner : SERVER BOT (in-game scanner account) =====
local TOKEN = "__BOT_TOKEN__"
local LOADER = 'loadstring(game:HttpGet("' .. API .. '/script/bot.lua?token=' .. TOKEN .. '"))()'
local ui = buildUI("Horloge Bot")
local queued = false
TeleportService.TeleportInitFailed:Connect(function() ui.status.Text = "Hop failed, retrying..." end)
while true do
    ui.status.Text = "Scanning..."
    local found, took = deepScan()
    local r = call("POST", "/logs/ingest", {job_id = game.JobId, place_id = game.PlaceId, players = #Players:GetPlayers(), brainrots = found}, {["X-Bot-Token"] = TOKEN})
    ui.status.Text = ("%d scanned, %d shared in %.1fs -> hopping"):format(#found, r and r.inserted or 0, took)
    if qot and not queued then queued = true; qot(LOADER) end
    pcall(hop)
    task.wait(6)
end
'''


def render(template: str, api: str, bot_token: str = "") -> str:
    return template.replace("__API__", api).replace("__BOT_TOKEN__", bot_token)
