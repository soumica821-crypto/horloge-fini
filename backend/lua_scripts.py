COMMON = r'''
local HttpService = game:GetService("HttpService")
local TeleportService = game:GetService("TeleportService")
local Players = game:GetService("Players")
local req = (syn and syn.request) or http_request or request or (http and http.request) or (fluxus and fluxus.request)
local qot = queue_on_teleport or (syn and syn.queue_on_teleport) or (fluxus and fluxus.queue_on_teleport)
local API = "__API__"

local function getHwid()
    local ok, id = pcall(function() return gethwid and gethwid() end)
    if ok and id then return tostring(id) end
    return game:GetService("RbxAnalyticsService"):GetClientId()
end

local function call(method, path, body, headers)
    local h = {["Content-Type"] = "application/json"}
    for k, v in pairs(headers or {}) do h[k] = v end
    local ok, res = pcall(req, {Url = API .. path, Method = method, Headers = h, Body = body and HttpService:JSONEncode(body) or nil})
    if not ok or not res or res.StatusCode ~= 200 then return nil, res and res.Body end
    return HttpService:JSONDecode(res.Body)
end

-- Scans every brainrot overhead in the server (instant, < 1s)
local function scan()
    local found = {}
    for _, d in ipairs(workspace:GetDescendants()) do
        if d:IsA("BillboardGui") and d.Name == "AnimalOverhead" then
            local n, m, g = d:FindFirstChild("DisplayName"), d:FindFirstChild("Mutation"), d:FindFirstChild("Generation")
            if n and n.Text ~= "" then
                table.insert(found, {
                    name = n.Text,
                    mutation = (m and m.Visible and m.Text ~= "") and m.Text or "Normal",
                    generation = g and g.Text or "",
                })
            end
        end
    end
    return found
end

local function hop()
    local placeId = game.PlaceId
    local ok, body = pcall(function()
        return game:HttpGet(("https://games.roblox.com/v1/games/%d/servers/Public?sortOrder=Desc&limit=100&excludeFullGames=true"):format(placeId))
    end)
    if ok then
        local servers = {}
        for _, s in ipairs((HttpService:JSONDecode(body).data) or {}) do
            if s.id ~= game.JobId and s.playing < s.maxPlayers then table.insert(servers, s.id) end
        end
        if #servers > 0 then
            TeleportService:TeleportToPlaceInstance(placeId, servers[math.random(1, #servers)], Players.LocalPlayer)
            return
        end
    end
    TeleportService:Teleport(placeId, Players.LocalPlayer)
end
'''

CLIENT = COMMON + r'''
-- ===== Horloge Joiner : Auto Joiner client =====
local KEY = (getgenv and getgenv().script_key) or script_key
local HWID = getHwid()
local auth, err = call("POST", "/script/auth", {key = KEY, hwid = HWID})
if not auth then warn("[Horloge Joiner] Auth failed: " .. tostring(err)) return end
print("[Horloge Joiner] Connected as " .. auth.username .. " | divisions: " .. table.concat(auth.divisions, ", "))

if auth.self_bot then
    local found = scan()
    if #found > 0 then
        call("POST", "/script/report", {key = KEY, hwid = HWID, job_id = game.JobId, place_id = game.PlaceId, players = #Players:GetPlayers(), brainrots = found})
    end
end

local since, seen = auth.server_time, {}
while true do
    local data = call("POST", "/script/poll", {key = KEY, hwid = HWID, since = since})
    if data then
        since = data.server_time
        for _, log in ipairs(data.logs) do
            if not seen[log.id] and data.auto_join and log.job_id ~= game.JobId then
                seen[log.id] = true
                print(("[Horloge Joiner] %s [%s] %s -> joining"):format(log.name, log.mutation, log.value_text))
                pcall(function() TeleportService:TeleportToPlaceInstance(log.place_id, log.job_id, Players.LocalPlayer) end)
            end
        end
    end
    task.wait(1)
end
'''

OWNER_SELFBOT = COMMON + r'''
-- ===== Horloge Joiner : OWNER SELF BOT (scan 1s -> report -> hop, until disabled in panel) =====
local KEY = (getgenv and getgenv().script_key) or script_key
local HWID = getHwid()
local LOADER = 'getgenv().script_key="' .. tostring(KEY) .. '"; loadstring(game:HttpGet("' .. API .. '/script/selfbot.lua"))()'

local status = call("POST", "/script/selfbot/status", {key = KEY, hwid = HWID})
if not status then warn("[Horloge SelfBot] Auth failed") return end
if not status.enabled then print("[Horloge SelfBot] Disabled from panel. Stopping.") return end

if not game:IsLoaded() then game.Loaded:Wait() end
task.wait(1) -- 1 second scan window
local found = scan()
call("POST", "/script/report", {key = KEY, hwid = HWID, job_id = game.JobId, place_id = game.PlaceId, players = #Players:GetPlayers(), brainrots = found, selfbot = true})
print(("[Horloge SelfBot] %d brainrots reported, hopping..."):format(#found))

status = call("POST", "/script/selfbot/status", {key = KEY, hwid = HWID})
if status and status.enabled then
    if qot then qot(LOADER) end
    hop()
else
    print("[Horloge SelfBot] Disabled from panel. Stopping.")
end
'''

BOT = COMMON + r'''
-- ===== Horloge Joiner : SERVER BOT (in-game scanner account) =====
local TOKEN = "__BOT_TOKEN__"
local LOADER = 'loadstring(game:HttpGet("' .. API .. '/script/bot.lua?token=' .. TOKEN .. '"))()'
if not game:IsLoaded() then game.Loaded:Wait() end
task.wait(1)
local found = scan()
call("POST", "/logs/ingest", {job_id = game.JobId, place_id = game.PlaceId, players = #Players:GetPlayers(), brainrots = found}, {["X-Bot-Token"] = TOKEN})
if qot then qot(LOADER) end
hop()
'''


def render(template: str, api: str, bot_token: str = "") -> str:
    return template.replace("__API__", api).replace("__BOT_TOKEN__", bot_token)
