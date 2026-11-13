using System;
using System.Collections;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Win32;

static class Program
{
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    static extern bool SetProcessDPIAware();

    [STAThread]
    static void Main()
    {
        bool created;
        using (var mutex = new Mutex(true, "Global\\ZhidaoPanelExe", out created))
        {
            if (!created) return;
            SetProcessDPIAware();
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}

class MainForm : Form
{
    const string Root = @"D:\zhidao-daily";
    const string RunBat = @"C:\Users\你的用户名\ego\zhidao-daily\run.bat";
    static readonly string StatusFile = Path.Combine(Root, "status.json");
    static readonly string StopFile = Path.Combine(Root, "stop.flag");
    static readonly string LogDir = Path.Combine(Root, "logs");

    double k = 1.0;
    int U(double v) { return (int)Math.Round(v * k); }
    float FS(float v) { return v; }

    Color cBg = Color.FromArgb(245, 247, 251);
    Color cCard = Color.White;
    Color cText = Color.FromArgb(28, 32, 42);
    Color cSub = Color.FromArgb(120, 128, 145);
    Color cAccent = Color.FromArgb(77, 107, 254);
    Color cAccentD = Color.FromArgb(58, 86, 220);
    Color cAccentL = Color.FromArgb(232, 237, 255);
    Color cGreen = Color.FromArgb(46, 158, 91);
    Color cGreenL = Color.FromArgb(231, 246, 238);
    Color cGrayL = Color.FromArgb(241, 243, 248);
    Color cErr = Color.FromArgb(214, 69, 69);
    Color cErrL = Color.FromArgb(252, 235, 235);
    Color cTrack = Color.FromArgb(235, 238, 246);
    Color cBorder = Color.FromArgb(222, 227, 236);

    Font fBase, fSmall, fBold, fStep, fTitle, fMono;
    Label stageChip, stepLbl, metaLbl, dot, conn;
    CourseUI mil, sec;
    Button startBtn, stopBtn;
    TextBox logBox;
    System.Windows.Forms.Timer timer;
    DateTime pendingUntil = DateTime.MinValue;
    DateTime stopDeadline = DateTime.MinValue;
    int stopPid = 0;
    bool stopKilled = false;
    string lastLog = "";

    class CourseUI
    {
        public Panel track, fill;
        public Label chip, prog, pct, ask, ans;
    }

    public MainForm()
    {
        k = 1.0;
        try
        {
            var v = Registry.GetValue(@"HKEY_CURRENT_USER\Control Panel\Desktop\WindowMetrics", "AppliedDPI", 96);
            if (v != null) k = Convert.ToDouble(v) / 96.0;
        }
        catch { k = 1.0; }

        fBase = new Font("Microsoft YaHei UI", FS(9f));
        fSmall = new Font("Microsoft YaHei UI", FS(8.25f));
        fBold = new Font("Microsoft YaHei UI", FS(10f), FontStyle.Bold);
        fStep = new Font("Microsoft YaHei UI", FS(13.5f), FontStyle.Bold);
        fTitle = new Font("Microsoft YaHei UI", FS(12f), FontStyle.Bold);
        fMono = new Font("Consolas", FS(8.25f));

        Text = "知到 · 每日任务";
        ClientSize = new Size(U(470), U(748));
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = cBg;
        Font = fBase;
        FormBorderStyle = FormBorderStyle.FixedSingle;
        MaximizeBox = false;
        AutoScaleMode = AutoScaleMode.None;
        Icon = SystemIcons.Application;

        var logo = MakeLabel("知", new Font("Microsoft YaHei UI", FS(14f), FontStyle.Bold), Color.White, 18, 14, 42, 42);
        logo.BackColor = cAccent;
        logo.TextAlign = ContentAlignment.MiddleCenter;
        Controls.Add(logo);
        Round(logo, U(11));

        Controls.Add(MakeLabel("知到 · 每日任务", fTitle, cText, 72, 15, 250, 26));
        Controls.Add(MakeLabel(DateTime.Now.ToString("yyyy 年 M 月 d 日"), fSmall, cSub, 73, 42, 200, 18));

        dot = MakeLabel("●", fSmall, cSub, 396, 18, 14, 18);
        conn = MakeLabel("等待", fSmall, cSub, 412, 18, 44, 18);
        Controls.Add(dot);
        Controls.Add(conn);

        var hero = new Panel { BackColor = cCard, Location = new Point(U(18), U(68)), Size = new Size(U(434), U(122)) };
        Controls.Add(hero);
        Round(hero, U(12));

        stageChip = MakeLabel("等待", fSmall, cSub, 14, 11, 66, 26);
        stageChip.BackColor = cGrayL;
        stageChip.TextAlign = ContentAlignment.MiddleCenter;
        hero.Controls.Add(stageChip);
        Round(stageChip, U(13));

        stepLbl = MakeLabel("等待启动", fStep, cText, 14, 40, 406, 54);
        hero.Controls.Add(stepLbl);
        metaLbl = MakeLabel("尚未运行", fSmall, cSub, 14, 96, 406, 18);
        hero.Controls.Add(metaLbl);

        mil = MakeCourse(200, "军事理论");
        sec = MakeCourse(352, "大学生国家安全教育");

        startBtn = new Button
        {
            Text = "立即运行",
            Font = fBold,
            ForeColor = Color.White,
            BackColor = cAccent,
            FlatStyle = FlatStyle.Flat,
            Location = new Point(U(18), U(506)),
            Size = new Size(U(210), U(42)),
            Cursor = Cursors.Hand
        };
        startBtn.FlatAppearance.BorderSize = 0;
        startBtn.FlatAppearance.MouseOverBackColor = cAccentD;
        startBtn.FlatAppearance.MouseDownBackColor = cAccentD;
        startBtn.Click += StartClick;
        Controls.Add(startBtn);
        Round(startBtn, U(10));

        stopBtn = new Button
        {
            Text = "停止任务",
            Font = fBase,
            ForeColor = cSub,
            BackColor = cCard,
            FlatStyle = FlatStyle.Flat,
            Location = new Point(U(242), U(506)),
            Size = new Size(U(210), U(42)),
            Cursor = Cursors.Hand,
            Enabled = false
        };
        stopBtn.FlatAppearance.BorderSize = 1;
        stopBtn.FlatAppearance.BorderColor = cBorder;
        stopBtn.FlatAppearance.MouseOverBackColor = cGrayL;
        stopBtn.Click += StopClick;
        Controls.Add(stopBtn);
        Round(stopBtn, U(10));

        var logCard = new Panel { BackColor = cCard, Location = new Point(U(18), U(560)), Size = new Size(U(434), U(172)) };
        Controls.Add(logCard);
        Round(logCard, U(12));

        logCard.Controls.Add(MakeLabel("最近日志", fBold, cText, 14, 10, 120, 20));

        var linkLog = new LinkLabel
        {
            Text = "打开日志文件夹",
            Font = fSmall,
            LinkColor = cAccent,
            ActiveLinkColor = cAccentD,
            TextAlign = ContentAlignment.MiddleRight,
            Location = new Point(U(280), U(11)),
            Size = new Size(U(138), U(18)),
            AutoSize = false
        };
        linkLog.LinkClicked += delegate { try { System.Diagnostics.Process.Start("explorer.exe", LogDir); } catch { } };
        logCard.Controls.Add(linkLog);

        logBox = new TextBox
        {
            Multiline = true,
            ReadOnly = true,
            BorderStyle = BorderStyle.None,
            ScrollBars = ScrollBars.Vertical,
            BackColor = cCard,
            ForeColor = Color.FromArgb(72, 80, 96),
            Font = fMono,
            Location = new Point(U(14), U(35)),
            Size = new Size(U(402), U(112))
        };
        logCard.Controls.Add(logBox);

        timer = new System.Windows.Forms.Timer { Interval = 1000 };
        timer.Tick += delegate { UpdateUI(); };
        timer.Start();

        Shown += delegate { UpdateUI(); };
    }

    Label MakeLabel(string text, Font font, Color color, double x, double y, double w, double h)
    {
        return new Label
        {
            Text = text,
            Font = font,
            ForeColor = color,
            BackColor = Color.Transparent,
            AutoSize = false,
            Location = new Point(U(x), U(y)),
            Size = new Size(U(w), U(h)),
            UseMnemonic = false
        };
    }

    CourseUI MakeCourse(double y, string title)
    {
        var ui = new CourseUI();
        var card = new Panel { BackColor = cCard, Location = new Point(U(18), U(y)), Size = new Size(U(434), U(144)) };
        Controls.Add(card);
        Round(card, U(12));

        card.Controls.Add(MakeLabel(title, fBold, cText, 14, 10, 300, 24));
        ui.chip = MakeLabel("等待", fSmall, cSub, 354, 10, 66, 24);
        ui.chip.BackColor = cGrayL;
        ui.chip.TextAlign = ContentAlignment.MiddleCenter;
        card.Controls.Add(ui.chip);
        Round(ui.chip, U(12));

        ui.track = new Panel { BackColor = cTrack, Location = new Point(U(14), U(46)), Size = new Size(U(406), U(8)) };
        card.Controls.Add(ui.track);
        Round(ui.track, U(4));

        ui.fill = new Panel { BackColor = cAccent, Location = new Point(0, 0), Size = new Size(0, U(8)) };
        ui.track.Controls.Add(ui.fill);

        ui.prog = MakeLabel("0:00 / 25:00", fSmall, cSub, 14, 58, 200, 18);
        ui.pct = MakeLabel("0%", fSmall, cSub, 300, 58, 120, 18);
        ui.pct.TextAlign = ContentAlignment.MiddleRight;
        card.Controls.Add(ui.prog);
        card.Controls.Add(ui.pct);

        var askBox = new Panel { BackColor = cGrayL, Location = new Point(U(14), U(82)), Size = new Size(U(196), U(50)) };
        card.Controls.Add(askBox);
        Round(askBox, U(8));
        askBox.Controls.Add(MakeLabel("提问", fSmall, cSub, 12, 4, 160, 16));
        ui.ask = MakeLabel("待发布", fBold, cSub, 12, 20, 170, 26);
        askBox.Controls.Add(ui.ask);

        var ansBox = new Panel { BackColor = cGrayL, Location = new Point(U(224), U(82)), Size = new Size(U(196), U(50)) };
        card.Controls.Add(ansBox);
        Round(ansBox, U(8));
        ansBox.Controls.Add(MakeLabel("回答", fSmall, cSub, 12, 4, 160, 16));
        ui.ans = MakeLabel("0/3", fBold, cSub, 12, 20, 170, 26);
        ansBox.Controls.Add(ui.ans);

        return ui;
    }

    static void Round(Control c, int radius)
    {
        if (c.Width <= 0 || c.Height <= 0) return;
        int d = Math.Min(radius * 2, Math.Min(c.Width, c.Height));
        using (var p = new GraphicsPath())
        {
            p.AddArc(0, 0, d, d, 180, 90);
            p.AddArc(c.Width - d, 0, d, d, 270, 90);
            p.AddArc(c.Width - d, c.Height - d, d, d, 0, 90);
            p.AddArc(0, c.Height - d, d, d, 90, 90);
            p.CloseFigure();
            c.Region = new Region(p);
        }
    }

    // ---------- data ----------

    static object Obj(IDictionary<string, object> d, string key)
    {
        if (d == null || !d.ContainsKey(key)) return null;
        return d[key];
    }

    static string Str(object o) { return o == null ? "" : o.ToString(); }
    static int Int(object o) { return o == null ? 0 : Convert.ToInt32(o); }
    static bool Bool(object o) { return o != null && Convert.ToBoolean(o); }

    static IDictionary<string, object> Dict(object o)
    {
        return o as IDictionary<string, object>;
    }

    IDictionary<string, object> ReadStatus()
    {
        try
        {
            if (!File.Exists(StatusFile)) return null;
            var json = File.ReadAllText(StatusFile, Encoding.UTF8);
            return new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(json);
        }
        catch { return null; }
    }

    static string Span(double seconds)
    {
        if (seconds < 0) seconds = 0;
        int total = (int)seconds;
        return string.Format("{0}:{1:00}", total / 60, total % 60);
    }

    static DateTimeOffset? ParseTime(object o)
    {
        if (o == null) return null;
        DateTimeOffset t;
        if (DateTimeOffset.TryParse(Str(o), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out t)) return t;
        return null;
    }

    // ---------- ui ----------

    static bool Alive(int pid)
    {
        if (pid <= 0) return false;
        try
        {
            var p = System.Diagnostics.Process.GetProcessById(pid);
            return !p.HasExited;
        }
        catch { return false; }
    }

    bool IsRunning(IDictionary<string, object> st)
    {
        if (st == null || !Bool(Obj(st, "running"))) return false;
        var ut = ParseTime(Obj(st, "updatedAt"));
        if (ut == null || (DateTimeOffset.UtcNow - ut.Value).TotalSeconds >= 180) return false;
        int pid = Int(Obj(st, "pid"));
        if (pid > 0 && !Alive(pid)) return false;
        return true;
    }

    void StopTick()
    {
        if (stopDeadline == DateTime.MinValue) return;
        var st = ReadStatus();
        bool stillRunning = st != null && Bool(Obj(st, "running"));
        if (!stillRunning) { FinishStop(); return; }
        if (!Alive(stopPid)) { FinishStop(); return; }
        if (!stopKilled && DateTime.Now >= stopDeadline)
        {
            stopKilled = true;
            try
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("taskkill.exe", "/PID " + stopPid + " /T /F")
                {
                    WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden,
                    CreateNoWindow = true
                });
            }
            catch { }
            stopDeadline = DateTime.Now.AddSeconds(3);
            return;
        }
        if (stopKilled && DateTime.Now >= stopDeadline) FinishStop();
    }

    void FinishStop()
    {
        var st = ReadStatus();
        if (st != null && Bool(Obj(st, "running")))
        {
            st["running"] = false;
            st["stage"] = "stopped";
            st["step"] = "任务已手动停止";
            st["updatedAt"] = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);
            try { File.WriteAllText(StatusFile, new JavaScriptSerializer().Serialize(st), new UTF8Encoding(false)); } catch { }
        }
        try { File.Delete(StopFile); } catch { }
        stopDeadline = DateTime.MinValue;
        stopPid = 0;
        stopKilled = false;
    }

    void UpdateUI()
    {
        StopTick();
        var st = ReadStatus();
        bool stopping = stopDeadline != DateTime.MinValue;
        bool running = !stopping && IsRunning(st);

        if (st == null)
        {
            SetChip(stageChip, "等待", cGrayL, cSub);
            stepLbl.Text = "等待启动";
            metaLbl.Text = "尚未运行";
            dot.ForeColor = cSub;
            conn.Text = "等待";
            conn.ForeColor = cSub;
            UpdateCourse(mil, null, "military", null, false);
            UpdateCourse(sec, null, "security", null, false);
        }
        else
        {
            string stage = Str(Obj(st, "stage"));
            if (stopping) { SetChip(stageChip, "停止中", cErrL, cErr); dot.ForeColor = cErr; conn.Text = "停止中"; conn.ForeColor = cErr; }
            else if (running) { SetChip(stageChip, "运行中", cAccentL, cAccent); dot.ForeColor = cGreen; conn.Text = "运行中"; conn.ForeColor = cGreen; }
            else if (stage == "done") { SetChip(stageChip, "已完成", cGreenL, cGreen); dot.ForeColor = cGreen; conn.Text = "已完成"; conn.ForeColor = cGreen; }
            else if (stage == "error") { SetChip(stageChip, "异常", cErrL, cErr); dot.ForeColor = cErr; conn.Text = "异常"; conn.ForeColor = cErr; }
            else if (stage == "stopped") { SetChip(stageChip, "已停止", cGrayL, cSub); dot.ForeColor = cSub; conn.Text = "已停止"; conn.ForeColor = cSub; }
            else { SetChip(stageChip, "等待", cGrayL, cSub); dot.ForeColor = cSub; conn.Text = "等待"; conn.ForeColor = cSub; }

            stepLbl.Text = Str(Obj(st, "step"));

            string meta = "";
            if (stopping) meta = "正在停止，最多等待 10 秒 · ";
            else if (running)
            {
                var started = ParseTime(Obj(st, "startedAt"));
                if (started != null) meta = "已运行 " + Span((DateTimeOffset.UtcNow - started.Value).TotalSeconds) + " · ";
            }
            var upd = ParseTime(Obj(st, "updatedAt"));
            if (upd != null) meta += "最近更新 " + upd.Value.LocalDateTime.ToString("HH:mm:ss");
            metaLbl.Text = meta;

            var courses = Dict(Obj(st, "courses"));
            UpdateCourse(mil, courses == null ? null : Dict(Obj(courses, "military")), "military", st, running);
            UpdateCourse(sec, courses == null ? null : Dict(Obj(courses, "security")), "security", st, running);
        }

        if (running && pendingUntil != DateTime.MinValue) pendingUntil = DateTime.MinValue;
        bool pending = DateTime.Now < pendingUntil;
        if (stopping) { startBtn.Text = "正在停止…"; startBtn.Enabled = false; stopBtn.Text = "正在停止…"; stopBtn.Enabled = false; }
        else if (pending) { startBtn.Text = "正在启动…"; startBtn.Enabled = false; stopBtn.Text = "停止任务"; stopBtn.Enabled = false; }
        else if (running) { startBtn.Text = "运行中"; startBtn.Enabled = false; stopBtn.Text = "停止任务"; stopBtn.Enabled = true; }
        else { startBtn.Text = "立即运行"; startBtn.Enabled = true; stopBtn.Text = "停止任务"; stopBtn.Enabled = false; }

        string text = ReadLogs(st);
        if (text != lastLog)
        {
            lastLog = text;
            logBox.Text = text;
            logBox.SelectionStart = logBox.Text.Length;
            logBox.ScrollToCaret();
        }
    }

    static void SetChip(Label chip, string text, Color bg, Color fg)
    {
        chip.Text = text;
        chip.BackColor = bg;
        chip.ForeColor = fg;
    }

    static string ReadLogs(IDictionary<string, object> st)
    {
        var lines = new List<string>();
        var arr = st == null ? null : Obj(st, "logs") as IEnumerable;
        if (arr != null)
        {
            foreach (var item in arr) lines.Add(Str(item));
        }
        return string.Join(Environment.NewLine, lines.ToArray());
    }

    void UpdateCourse(CourseUI ui, IDictionary<string, object> data, string key, IDictionary<string, object> st, bool running)
    {
        int secs = 0, target = 1500, answers = 0;
        bool hasQuestion = false;
        string state = "idle";
        if (data != null)
        {
            secs = Int(Obj(data, "studySeconds"));
            target = Int(Obj(data, "target"));
            answers = Int(Obj(data, "answers"));
            hasQuestion = Obj(data, "question") != null && Str(Obj(data, "question")).Length > 0;
            state = Str(Obj(data, "state"));
        }
        if (target <= 0) target = 1500;
        if (running && st != null && Str(Obj(st, "currentCourse")) == key && state != "done" && state != "error") state = "learning";

        if (state == "done") SetChip(ui.chip, "已完成", cGreenL, cGreen);
        else if (state == "learning") SetChip(ui.chip, "学习中", cAccentL, cAccent);
        else if (state == "error") SetChip(ui.chip, "出错", cErrL, cErr);
        else SetChip(ui.chip, "等待", cGrayL, cSub);

        double ratio = Math.Min(1.0, (double)secs / target);
        ui.fill.Width = (int)(ui.track.Width * ratio);
        ui.fill.BackColor = state == "done" ? cGreen : (state == "error" ? cErr : cAccent);
        if (ui.fill.Width > 0) Round(ui.fill, ui.fill.Height / 2);

        ui.prog.Text = Span(secs) + " / " + Span(target);
        ui.pct.Text = ((int)Math.Floor(100 * ratio)) + "%";
        ui.pct.ForeColor = ratio >= 1 ? cGreen : cSub;

        ui.ask.Text = hasQuestion ? "已发布" : "待发布";
        ui.ask.ForeColor = hasQuestion ? cGreen : cSub;

        ui.ans.Text = answers + "/3";
        ui.ans.ForeColor = answers >= 3 ? cGreen : (answers > 0 ? cAccent : cSub);
    }

    // ---------- actions ----------

    void StartClick(object sender, EventArgs e)
    {
        var st = ReadStatus();
        if (IsRunning(st)) return;

        try
        {
            try { File.Delete(StopFile); } catch { }
            stopDeadline = DateTime.MinValue;
            stopPid = 0;
            stopKilled = false;
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("cmd.exe", "/c \"" + RunBat + "\"")
            {
                WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden,
                CreateNoWindow = true
            });
            pendingUntil = DateTime.Now.AddSeconds(15);
            UpdateUI();
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, "启动失败：" + ex.Message, "知到 · 每日任务", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    void StopClick(object sender, EventArgs e)
    {
        if (stopDeadline != DateTime.MinValue) return;
        var r = MessageBox.Show(this, "确定停止当前任务吗？脚本会先暂停视频并保存进度，10 秒内未退出则强制结束。", "停止任务", MessageBoxButtons.YesNo, MessageBoxIcon.Warning);
        if (r != DialogResult.Yes) return;
        try { File.WriteAllText(StopFile, "stop", new UTF8Encoding(false)); } catch { }
        var st = ReadStatus();
        stopPid = st == null ? 0 : Int(Obj(st, "pid"));
        stopKilled = false;
        stopDeadline = DateTime.Now.AddSeconds(10);
        UpdateUI();
    }
}
