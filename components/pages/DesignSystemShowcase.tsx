import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Slider } from "../ui/slider";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  XCircle,
  Flag,
  Trophy,
  Target,
  UserPlus,
  Users,
  Send,
  Share2,
  Plus,
  Minus,
  Edit,
  Check,
  ChevronRight,
  BarChart3,
  Crown
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../ui/dialog";

export function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="size-6 text-primary" />
            <h1>Golf Score Tracker</h1>
          </div>
          <p className="text-muted-foreground">
            Mobile design system for scorecard tracking
          </p>
        </div>

        <Tabs defaultValue="components" className="space-y-6">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="components">UI</TabsTrigger>
            <TabsTrigger value="scorecard">Score</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
          </TabsList>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-8">
            {/* Buttons */}
            <section>
              <h2 className="mb-4">Buttons</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-muted-foreground">Score Dialog</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Edit className="mr-2 size-4" />
                        Open Score Entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                          <span>Hole 7</span>
                          <Badge className="bg-blue-600 text-white">Par 4</Badge>
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                          Enter your score for hole 7
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        {/* Username */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Avatar className="size-10">
                              <AvatarFallback className="bg-green-500 text-white">JD</AvatarFallback>
                            </Avatar>
                            <span>John Doe</span>
                          </div>
                        </div>

                        {/* Stroke Counter */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-4">
                            <Button size="icon" variant="outline" className="size-12 rounded-full">
                              <Minus className="size-5" />
                            </Button>
                            <div className="text-center min-w-[80px]">
                              <div className="text-4xl">5</div>
                            </div>
                            <Button size="icon" variant="outline" className="size-12 rounded-full">
                              <Plus className="size-5" />
                            </Button>
                          </div>
                          
                          {/* Score Type Badge */}
                          <div className="flex justify-center">
                            <Badge className="bg-green-600 text-white px-4 py-1">Bogey</Badge>
                          </div>
                        </div>

                        {/* Save Button */}
                        <Button className="w-full h-12">
                          <Check className="mr-2 size-5" />
                          Save Score
                        </Button>

                        {/* Remove/Skip Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" className="h-11">
                            Remove Score
                          </Button>
                          <Button variant="outline" className="h-11">
                            Skip Hole
                          </Button>
                        </div>

                        <Separator />

                        {/* Hole Stats */}
                        <div className="space-y-4">
                          <h3>Hole Stats</h3>
                          
                          {/* Fairway */}
                          <div className="space-y-2">
                            <Label>Fairway</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <Button variant="outline" size="sm" className="h-10">
                                Hit
                              </Button>
                              <Button variant="outline" size="sm" className="h-10">
                                Miss Short
                              </Button>
                              <Button variant="outline" size="sm" className="h-10">
                                Miss Long
                              </Button>
                              <Button variant="outline" size="sm" className="h-10">
                                Miss Left
                              </Button>
                              <Button variant="outline" size="sm" className="h-10">
                                Miss Right
                              </Button>
                            </div>
                          </div>

                          {/* Putt */}
                          <div className="space-y-2">
                            <Label>Putts</Label>
                            <div className="flex items-center justify-between">
                              <Button size="icon" variant="outline" className="size-10">
                                <Minus className="size-4" />
                              </Button>
                              <span className="text-2xl min-w-[60px] text-center">2</span>
                              <Button size="icon" variant="outline" className="size-10">
                                <Plus className="size-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Bunker */}
                          <div className="space-y-2">
                            <Label>Bunker</Label>
                            <div className="flex items-center justify-between">
                              <Button size="icon" variant="outline" className="size-10">
                                <Minus className="size-4" />
                              </Button>
                              <span className="text-2xl min-w-[60px] text-center">0</span>
                              <Button size="icon" variant="outline" className="size-10">
                                <Plus className="size-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Hazard */}
                          <div className="space-y-2">
                            <Label>Hazard</Label>
                            <div className="flex items-center justify-between">
                              <Button size="icon" variant="outline" className="size-10">
                                <Minus className="size-4" />
                              </Button>
                              <span className="text-2xl min-w-[60px] text-center">0</span>
                              <Button size="icon" variant="outline" className="size-10">
                                <Plus className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div>
                  <h3 className="mb-3 text-muted-foreground">Primary Actions</h3>
                  <div className="flex flex-col gap-3">
                    <Button className="w-full">Start New Round</Button>
                    <Button variant="secondary" className="w-full">View History</Button>
                    <Button variant="outline" className="w-full">Edit Score</Button>
                    <Button variant="destructive" className="w-full">Delete Round</Button>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Score Badges */}
            <section>
              <h2 className="mb-4">Score Badges</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Hole in One</span>
                  <Badge className="bg-purple-600 text-white">-4</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Albatross</span>
                  <Badge className="bg-fuchsia-600 text-white">-3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Eagle</span>
                  <Badge className="bg-orange-600 text-white">-2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Birdie</span>
                  <Badge className="bg-red-600 text-white">-1</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Par</span>
                  <Badge className="bg-blue-600 text-white">E</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Bogey</span>
                  <Badge className="bg-green-600 text-white">+1</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Double Bogey</span>
                  <Badge className="bg-gray-600 text-white">+2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Triple Bogey+</span>
                  <Badge className="bg-black text-white">+3</Badge>
                </div>
              </div>
            </section>

            <Separator />

            {/* Player Avatars */}
            <section>
              <h2 className="mb-4">Player Avatars</h2>
              <div className="space-y-4">
                <h3 className="text-muted-foreground">Individual</h3>
                <div className="flex items-center gap-4 overflow-x-auto pb-2">
                  <div className="flex flex-col items-center gap-2 min-w-[64px]">
                    <Avatar className="size-14">
                      <AvatarFallback className="bg-green-500 text-white">JD</AvatarFallback>
                    </Avatar>
                    <span>John</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 min-w-[64px]">
                    <Avatar className="size-14">
                      <AvatarFallback className="bg-blue-500 text-white">SM</AvatarFallback>
                    </Avatar>
                    <span>Sarah</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 min-w-[64px]">
                    <Avatar className="size-14">
                      <AvatarFallback className="bg-purple-500 text-white">MK</AvatarFallback>
                    </Avatar>
                    <span>Mike</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 min-w-[64px]">
                    <Avatar className="size-14">
                      <AvatarFallback className="bg-orange-500 text-white">AL</AvatarFallback>
                    </Avatar>
                    <span>Alex</span>
                  </div>
                </div>

                <h3 className="text-muted-foreground pt-2">Group Stack</h3>
                <div className="flex items-center -space-x-3">
                  <Avatar className="border-2 border-background size-12">
                    <AvatarFallback className="bg-green-500 text-white">JD</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-2 border-background size-12">
                    <AvatarFallback className="bg-blue-500 text-white">SM</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-2 border-background size-12">
                    <AvatarFallback className="bg-purple-500 text-white">MK</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-2 border-background size-12">
                    <AvatarFallback className="bg-muted">+2</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </section>

            <Separator />

            {/* Input Components */}
            <section>
              <h2 className="mb-4">Score Input</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="score">Strokes</Label>
                    <Input id="score" type="number" placeholder="4" className="text-center h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="putts">Putts</Label>
                    <Input id="putts" type="number" placeholder="2" className="text-center h-12" />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fir">Fairway Hit</Label>
                    <Switch id="fir" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gir">Green in Regulation</Label>
                    <Switch id="gir" />
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Alerts */}
            <section>
              <h2 className="mb-4">Notifications</h2>
              <div className="space-y-3">
                <Alert className="border-green-500 text-green-500">
                  <CheckCircle2 className="size-4" />
                  <AlertTitle>Round Completed!</AlertTitle>
                  <AlertDescription>
                    Your score of 82 has been saved
                  </AlertDescription>
                </Alert>

                <Alert>
                  <UserPlus className="size-4" />
                  <AlertTitle>Friend Request</AlertTitle>
                  <AlertDescription>
                    Sarah wants to join your next round
                  </AlertDescription>
                </Alert>

                <Alert className="border-blue-500 text-blue-500">
                  <Trophy className="size-4" />
                  <AlertTitle>New Personal Best!</AlertTitle>
                  <AlertDescription>
                    You beat your best by 3 strokes!
                  </AlertDescription>
                </Alert>
              </div>
            </section>
          </TabsContent>

          {/* Scorecard Tab */}
          <TabsContent value="scorecard" className="space-y-6">
            <section>
              <h2 className="mb-4">Round History</h2>
              
              {/* Round Cards */}
              <div className="space-y-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3>Pine Valley Golf Club</h3>
                        <p className="text-muted-foreground">Nov 15, 2025</p>
                      </div>
                      <Badge className="bg-primary text-primary-foreground text-xl px-3 py-1">82</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-2">
                        <Avatar className="border-2 border-background size-8">
                          <AvatarFallback className="bg-green-500 text-white text-xs">JD</AvatarFallback>
                        </Avatar>
                        <Avatar className="border-2 border-background size-8">
                          <AvatarFallback className="bg-blue-500 text-white text-xs">SM</AvatarFallback>
                        </Avatar>
                        <Avatar className="border-2 border-background size-8">
                          <AvatarFallback className="bg-purple-500 text-white text-xs">MK</AvatarFallback>
                        </Avatar>
                        <Avatar className="border-2 border-background size-8">
                          <AvatarFallback className="bg-orange-500 text-white text-xs">AL</AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-muted-foreground">4 players</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3>Oakmont Country Club</h3>
                        <p className="text-muted-foreground">Nov 10, 2025</p>
                      </div>
                      <Badge className="bg-primary text-primary-foreground text-xl px-3 py-1">78</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-2">
                        <Avatar className="border-2 border-background size-8">
                          <AvatarFallback className="bg-green-500 text-white text-xs">JD</AvatarFallback>
                        </Avatar>
                        <Avatar className="border-2 border-background size-8">
                          <AvatarFallback className="bg-purple-500 text-white text-xs">MK</AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-muted-foreground">2 players</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3>Pebble Beach Golf Links</h3>
                        <p className="text-muted-foreground">Nov 3, 2025</p>
                      </div>
                      <Badge className="bg-primary text-primary-foreground text-xl px-3 py-1">85</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-2">
                        <Avatar className="border-2 border-background size-8">
                          <AvatarFallback className="bg-green-500 text-white text-xs">JD</AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-muted-foreground">Solo round</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3>Augusta National Golf Club</h3>
                        <p className="text-muted-foreground">Oct 28, 2025</p>
                      </div>
                      <Badge className="bg-primary text-primary-foreground text-xl px-3 py-1">91</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-2">
                        <Avatar className="border-2 border-background size-8">
                          <AvatarFallback className="bg-green-500 text-white text-xs">JD</AvatarFallback>
                        </Avatar>
                        <Avatar className="border-2 border-background size-8">
                          <AvatarFallback className="bg-blue-500 text-white text-xs">SM</AvatarFallback>
                        </Avatar>
                        <Avatar className="border-2 border-background size-8">
                          <AvatarFallback className="bg-teal-500 text-white text-xs">RJ</AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-muted-foreground">3 players</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="mb-4">Current Round</h2>
              
              {/* Single Hole */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Hole 7</CardTitle>
                        <CardDescription>Par 4 • 385 yds</CardDescription>
                      </div>
                      <Badge className="bg-blue-600 text-white">Par 4</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-3 rounded-lg bg-accent">
                        <div className="text-muted-foreground mb-1">Par</div>
                        <div>4</div>
                      </div>
                      <div className="text-center p-3 rounded-lg border-2 border-primary bg-primary/5">
                        <div className="text-muted-foreground mb-1">Score</div>
                        <div className="text-primary">5</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-accent">
                        <div className="text-muted-foreground mb-1">Putts</div>
                        <div>2</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-accent">
                        <div className="text-muted-foreground mb-1">+/-</div>
                        <Badge className="bg-green-600 text-white">+1</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm">
                        <Target className="mr-1 size-4" />
                        FIR
                      </Button>
                      <Button variant="outline" size="sm">
                        <Target className="mr-1 size-4" />
                        GIR
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-1 size-4" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Score Entry Pad */}
                <Card>
                  <CardHeader>
                    <CardTitle>Enter Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          className="h-14 rounded-lg border-2 hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Compact Front 9 */}
                <Card>
                  <CardHeader>
                    <CardTitle>18 Hole Scorecard</CardTitle>
                    <CardDescription>Pine Valley Golf Club</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto -mx-6 px-6">
                      <table className="w-full text-center border-collapse">
                        <thead>
                          <tr className="border-b-2">
                            <th className="p-2 border-r sticky left-0 bg-background z-10 w-36">Hole</th>
                            <th className="p-2 border-r">1</th>
                            <th className="p-2 border-r">2</th>
                            <th className="p-2 border-r">3</th>
                            <th className="p-2 border-r">4</th>
                            <th className="p-2 border-r">5</th>
                            <th className="p-2 border-r">6</th>
                            <th className="p-2 border-r">7</th>
                            <th className="p-2 border-r">8</th>
                            <th className="p-2 border-r-2">9</th>
                            <th className="p-2 border-r-2 bg-accent">Out</th>
                            <th className="p-2 border-r">10</th>
                            <th className="p-2 border-r">11</th>
                            <th className="p-2 border-r">12</th>
                            <th className="p-2 border-r">13</th>
                            <th className="p-2 border-r">14</th>
                            <th className="p-2 border-r">15</th>
                            <th className="p-2 border-r">16</th>
                            <th className="p-2 border-r">17</th>
                            <th className="p-2 border-r-2">18</th>
                            <th className="p-2 border-r-2 bg-accent">In</th>
                            <th className="p-2 bg-primary/10">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2 text-muted-foreground border-r sticky left-0 bg-background z-10 w-36">Par</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">3</td>
                            <td className="p-2 border-r">5</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">3</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">5</td>
                            <td className="p-2 border-r-2">4</td>
                            <td className="p-2 border-r-2 bg-accent">36</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">3</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">5</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">3</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">5</td>
                            <td className="p-2 border-r-2">4</td>
                            <td className="p-2 border-r-2 bg-accent">36</td>
                            <td className="p-2 bg-primary/10">72</td>
                          </tr>
                          <tr>
                            <td className="p-2 border-r sticky left-0 bg-background z-10 w-36">You</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">2</td>
                            <td className="p-2 border-r">5</td>
                            <td className="p-2 border-r">5</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">3</td>
                            <td className="p-2 border-r">5</td>
                            <td className="p-2 border-r">5</td>
                            <td className="p-2 border-r-2">4</td>
                            <td className="p-2 border-r-2 bg-accent">37</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">3</td>
                            <td className="p-2 border-r">3</td>
                            <td className="p-2 border-r">6</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">4</td>
                            <td className="p-2 border-r">6</td>
                            <td className="p-2 border-r">5</td>
                            <td className="p-2 border-r-2">5</td>
                            <td className="p-2 border-r-2 bg-accent">45</td>
                            <td className="p-2 bg-primary/10">82</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Group Leaderboard */}
                <Card>
                  <CardHeader>
                    <CardTitle>Group - Hole 7</CardTitle>
                    <CardDescription>4 players</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <Crown className="size-5 text-yellow-600" />
                          <Avatar className="size-10">
                            <AvatarFallback className="bg-green-500 text-white">JD</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>John</div>
                            <div className="text-muted-foreground">+2</div>
                          </div>
                        </div>
                        <Badge className="bg-blue-600 text-white">4</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-5"></div>
                          <Avatar className="size-10">
                            <AvatarFallback className="bg-blue-500 text-white">SM</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>Sarah</div>
                            <div className="text-muted-foreground">+5</div>
                          </div>
                        </div>
                        <Badge className="bg-green-600 text-white">5</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-5"></div>
                          <Avatar className="size-10">
                            <AvatarFallback className="bg-purple-500 text-white">MK</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>Mike</div>
                            <div className="text-muted-foreground">Even</div>
                          </div>
                        </div>
                        <Badge className="bg-red-600 text-white">3</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-5"></div>
                          <Avatar className="size-10">
                            <AvatarFallback className="bg-orange-500 text-white">AL</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>Alex</div>
                            <div className="text-muted-foreground">+3</div>
                          </div>
                        </div>
                        <Badge className="bg-blue-600 text-white">4</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Round Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Round Summary</CardTitle>
                    <CardDescription>Pine Valley GC • Nov 15, 2025</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-center p-4 rounded-lg bg-primary/10">
                        <div className="text-muted-foreground mb-1">Total</div>
                        <div className="text-primary">82</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-accent">
                        <div className="text-muted-foreground mb-1">To Par</div>
                        <div>+10</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-accent">
                        <div className="text-muted-foreground mb-1">Putts</div>
                        <div>32</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-accent">
                        <div className="text-muted-foreground mb-1">Fairways</div>
                        <div>9/14</div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Hole in One</span>
                        <Badge className="bg-purple-600 text-white">0</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Albatross</span>
                        <Badge className="bg-fuchsia-600 text-white">0</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Eagles</span>
                        <Badge className="bg-orange-600 text-white">0</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Birdies</span>
                        <Badge className="bg-red-600 text-white">2</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Pars</span>
                        <Badge className="bg-blue-600 text-white">10</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Bogeys</span>
                        <Badge className="bg-green-600 text-white">5</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Double Bogeys</span>
                        <Badge className="bg-gray-600 text-white">1</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Triple+</span>
                        <Badge className="bg-black text-white">0</Badge>
                      </div>
                    </div>

                    <Button className="w-full mt-4">
                      <Share2 className="mr-2 size-4" />
                      Share Round
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-6">
            <section>
              <h2 className="mb-4">Friends & Invites</h2>
              
              <div className="space-y-4">
                {/* Invite Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Invite to Round</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="friend@example.com" 
                          className="h-11"
                        />
                        <Button size="icon" className="size-11">
                          <Send className="size-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Quick Invite</Label>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start h-12">
                          <Avatar className="size-8 mr-3">
                            <AvatarFallback className="bg-green-500 text-white">JD</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-left">John Doe</span>
                          <CheckCircle2 className="size-5 text-green-500" />
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12">
                          <Avatar className="size-8 mr-3">
                            <AvatarFallback className="bg-blue-500 text-white">SM</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-left">Sarah Miller</span>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12">
                          <Avatar className="size-8 mr-3">
                            <AvatarFallback className="bg-purple-500 text-white">MK</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-left">Mike Kumar</span>
                          <CheckCircle2 className="size-5 text-green-500" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button className="w-full h-12">
                      <UserPlus className="mr-2 size-5" />
                      Send Invites (2)
                    </Button>
                  </CardContent>
                </Card>

                {/* Pending Invitations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg border space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-12">
                            <AvatarFallback className="bg-teal-500 text-white">RJ</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div>Rachel Jones</div>
                            <div className="text-muted-foreground">Oak Valley GC</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">Accept</Button>
                          <Button size="sm" variant="outline" className="flex-1">Decline</Button>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-12">
                            <AvatarFallback className="bg-pink-500 text-white">TC</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div>Tom Chen</div>
                            <div className="text-muted-foreground">Tomorrow 9am</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">Accept</Button>
                          <Button size="sm" variant="outline" className="flex-1">Decline</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Friends List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Friends</CardTitle>
                    <CardDescription>12 golf buddies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-12">
                            <AvatarFallback className="bg-green-500 text-white">JD</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>John Doe</div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Trophy className="size-3" />
                              <span>Avg: 82</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <UserPlus className="size-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-12">
                            <AvatarFallback className="bg-blue-500 text-white">SM</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>Sarah Miller</div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Trophy className="size-3" />
                              <span>Avg: 88</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <UserPlus className="size-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-12">
                            <AvatarFallback className="bg-purple-500 text-white">MK</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>Mike Kumar</div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Trophy className="size-3" />
                              <span>Avg: 76</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <UserPlus className="size-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-12">
                            <AvatarFallback className="bg-orange-500 text-white">AL</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>Alex Lee</div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Trophy className="size-3" />
                              <span>Avg: 91</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <UserPlus className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Share Options */}
                <Card>
                  <CardHeader>
                    <CardTitle>Share Score</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start h-12">
                      <Share2 className="mr-3 size-5" />
                      Share to social media
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12">
                      <Send className="mr-3 size-5" />
                      Send via message
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12">
                      <Users className="mr-3 size-5" />
                      Share with group
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            <section>
              <h2 className="mb-4">Color System</h2>
              
              <div className="space-y-4">
                {/* Score Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Golf Score Colors</CardTitle>
                    <CardDescription>Color-coded score badges</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-12 flex-1 rounded-lg bg-[#9333ea] flex items-center justify-center text-white">Hole in One</div>
                      <span className="text-sm text-muted-foreground w-20">#9333ea</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 flex-1 rounded-lg bg-[#c026d3] flex items-center justify-center text-white">Albatross (-3)</div>
                      <span className="text-sm text-muted-foreground w-20">#c026d3</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 flex-1 rounded-lg bg-[#ea580c] flex items-center justify-center text-white">Eagle (-2)</div>
                      <span className="text-sm text-muted-foreground w-20">#ea580c</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 flex-1 rounded-lg bg-[#dc2626] flex items-center justify-center text-white">Birdie (-1)</div>
                      <span className="text-sm text-muted-foreground w-20">#dc2626</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 flex-1 rounded-lg bg-[#2563eb] flex items-center justify-center text-white">Par (E)</div>
                      <span className="text-sm text-muted-foreground w-20">#2563eb</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 flex-1 rounded-lg bg-[#16a34a] flex items-center justify-center text-white">Bogey (+1)</div>
                      <span className="text-sm text-muted-foreground w-20">#16a34a</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 flex-1 rounded-lg bg-[#4b5563] flex items-center justify-center text-white">Double Bogey (+2)</div>
                      <span className="text-sm text-muted-foreground w-20">#4b5563</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 flex-1 rounded-lg bg-black flex items-center justify-center text-white">Triple+ (+3)</div>
                      <span className="text-sm text-muted-foreground w-20">#000000</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Brand Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Brand Colors</CardTitle>
                    <CardDescription>Primary, secondary, and tertiary brand colors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Primary</div>
                      <div className="h-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">Forest Green</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Primary Hover</div>
                      <div className="h-12 rounded-lg bg-[color:var(--primary-hover)] flex items-center justify-center text-white">Darker Primary</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Secondary</div>
                      <div className="h-12 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground">Tan/Brown</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Secondary Hover</div>
                      <div className="h-12 rounded-lg bg-[color:var(--secondary-hover)] flex items-center justify-center text-white">Darker Secondary</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Tertiary</div>
                      <div className="h-12 rounded-lg bg-[color:var(--tertiary)] flex items-center justify-center text-[color:var(--tertiary-foreground)]">Medium Green</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Semantic Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Semantic Colors</CardTitle>
                    <CardDescription>Colors that convey meaning</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Success</div>
                      <div className="h-12 rounded-lg bg-[color:var(--success)] flex items-center justify-center text-[color:var(--success-foreground)]">
                        <CheckCircle2 className="size-5 mr-2" />
                        Confirmations & achievements
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Warning</div>
                      <div className="h-12 rounded-lg bg-[color:var(--warning)] flex items-center justify-center text-[color:var(--warning-foreground)]">
                        <AlertCircle className="size-5 mr-2" />
                        Cautions & notices
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Info</div>
                      <div className="h-12 rounded-lg bg-[color:var(--info)] flex items-center justify-center text-[color:var(--info-foreground)]">
                        <Info className="size-5 mr-2" />
                        Tips & information
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Error</div>
                      <div className="h-12 rounded-lg bg-[color:var(--error)] flex items-center justify-center text-[color:var(--error-foreground)]">
                        <XCircle className="size-5 mr-2" />
                        Errors & critical alerts
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Destructive</div>
                      <div className="h-12 rounded-lg bg-destructive flex items-center justify-center text-destructive-foreground">Delete actions & warnings</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Golf Course Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Golf Course Colors</CardTitle>
                    <CardDescription>Themed colors for shot tracking</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Fairway</div>
                      <div className="h-12 rounded-lg bg-[color:var(--fairway)] flex items-center justify-center text-[color:var(--fairway-foreground)]">Fairway hits & GIR</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Rough</div>
                      <div className="h-12 rounded-lg bg-[color:var(--rough)] flex items-center justify-center text-[color:var(--rough-foreground)]">Shots from rough</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Sand</div>
                      <div className="h-12 rounded-lg bg-[color:var(--sand)] flex items-center justify-center text-[color:var(--sand-foreground)]">Bunker shots & sand saves</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Water</div>
                      <div className="h-12 rounded-lg bg-[color:var(--water)] flex items-center justify-center text-[color:var(--water-foreground)]">Water hazards & penalties</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Green</div>
                      <div className="h-12 rounded-lg bg-[color:var(--green)] flex items-center justify-center text-[color:var(--green-foreground)]">Putts & green indicators</div>
                    </div>
                  </CardContent>
                </Card>

                {/* UI State Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle>UI State Colors</CardTitle>
                    <CardDescription>Backgrounds and states for UI elements</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Muted</div>
                      <div className="h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">Subtle backgrounds</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Accent</div>
                      <div className="h-12 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">Hover states</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Subtle</div>
                      <div className="h-12 rounded-lg bg-[color:var(--subtle)] flex items-center justify-center text-[color:var(--subtle-foreground)]">Very light backgrounds</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Highlight</div>
                      <div className="h-12 rounded-lg bg-[color:var(--highlight)] flex items-center justify-center text-[color:var(--highlight-foreground)]">
                        <Crown className="size-5 mr-2" />
                        Emphasized sections
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Surface</div>
                      <div className="h-12 rounded-lg bg-[color:var(--surface)] border flex items-center justify-center text-[color:var(--surface-foreground)]">Card backgrounds</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Chart Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Chart Colors</CardTitle>
                    <CardDescription>8 colors for data visualization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Chart 1</div>
                        <div className="h-12 rounded-lg bg-[color:var(--chart-1)] flex items-center justify-center text-white">Primary</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Chart 2</div>
                        <div className="h-12 rounded-lg bg-[color:var(--chart-2)] flex items-center justify-center text-white">Secondary</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Chart 3</div>
                        <div className="h-12 rounded-lg bg-[color:var(--chart-3)] flex items-center justify-center text-white">Tertiary</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Chart 4</div>
                        <div className="h-12 rounded-lg bg-[color:var(--chart-4)] flex items-center justify-center text-white">Trends</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Chart 5</div>
                        <div className="h-12 rounded-lg bg-[color:var(--chart-5)] flex items-center justify-center text-white">Stats</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Chart 6</div>
                        <div className="h-12 rounded-lg bg-[color:var(--chart-6)] flex items-center justify-center text-white">Fairways</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Chart 7</div>
                        <div className="h-12 rounded-lg bg-[color:var(--chart-7)] flex items-center justify-center text-white">Hazards</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Chart 8</div>
                        <div className="h-12 rounded-lg bg-[color:var(--chart-8)] flex items-center justify-center text-white">Water</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Borders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Border Colors</CardTitle>
                    <CardDescription>Border styles for various emphasis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Default Border</div>
                      <div className="h-12 rounded-lg bg-card border border-border flex items-center justify-center text-foreground">Standard border</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Strong Border</div>
                      <div className="h-12 rounded-lg bg-card border-2 border-[color:var(--border-strong)] flex items-center justify-center text-foreground">Emphasized border</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Examples */}
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Examples</CardTitle>
                    <CardDescription>Real-world color combinations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Success Alert</div>
                      <div className="bg-[color:var(--success)] text-[color:var(--success-foreground)] p-4 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="size-5" />
                        <span>Round saved successfully! Score: 72 (-2)</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Warning Banner</div>
                      <div className="bg-[color:var(--warning)] text-[color:var(--warning-foreground)] p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle className="size-5" />
                        <span>Weather delay - Round suspended at hole 12</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Course Stats Badges</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-[color:var(--fairway)] text-[color:var(--fairway-foreground)]">12/14 Fairways</Badge>
                        <Badge className="bg-[color:var(--green)] text-[color:var(--green-foreground)]">14/18 GIR</Badge>
                        <Badge className="bg-[color:var(--sand)] text-[color:var(--sand-foreground)]">2 Sand Saves</Badge>
                        <Badge className="bg-[color:var(--water)] text-[color:var(--water-foreground)]">1 Water</Badge>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Highlighted Achievement</div>
                      <div className="bg-[color:var(--highlight)] text-[color:var(--highlight-foreground)] border-2 border-primary p-4 rounded-lg flex items-center gap-2">
                        <Trophy className="size-5" />
                        <span>Personal Best! New low score: 68 (-4)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Color Summary */}
                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <div className="text-3xl">56+</div>
                      <div>Color Options Available</div>
                      <div className="text-sm opacity-90">
                        Brand • Semantic • Golf Course • Score • UI State • Chart • Border
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Typography</CardTitle>
                    <CardDescription>Athiti Font Family</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h1>Heading 1</h1>
                      <p className="text-muted-foreground">Large titles</p>
                    </div>
                    <Separator />
                    <div>
                      <h2>Heading 2</h2>
                      <p className="text-muted-foreground">Section headers</p>
                    </div>
                    <Separator />
                    <div>
                      <h3>Heading 3</h3>
                      <p className="text-muted-foreground">Card titles</p>
                    </div>
                    <Separator />
                    <div>
                      <p>Regular paragraph text for body content and descriptions.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}