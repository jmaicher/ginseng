task :build => :jshint do
  # check if node is available
  which "node" or fail "node could not be found on your $PATH."
 
  puts "Building ginseng with r.js ...\n\n" 
  # create build with r.js using the build.js config
  sh "node vendor/r.js -o build.js"
end

task :jshint do
  # check if jshint is available
  which "jshint" or fail "jshint could not be found on your $PATH. You can install jshint with npm: npm install -g jshint"
  src_dir = "lib/"
  puts "Running jshint against #{src_dir} ...\n\n"

  sh "jshint #{src_dir}" do |ok, res|
    unless ok
      fail "jshint test failed with errors listed above!\n\n"
      puts res
    end
  end

  puts "jshint passed without errors!\n\n"
end


####################
## Helpers #########
####################

def which(cmd)
  exts = ENV['PATHEXT'] ? ENV['PATHEXT'].split(';') : ['']
  ENV['PATH'].split(File::PATH_SEPARATOR).each do |path|
    exts.each do |ext|
      exe = "#{path}/#{cmd}#{ext}"
      return exe if File.executable? exe
    end
  end
  return nil
end
